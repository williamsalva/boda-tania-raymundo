import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizarSlug } from "./slug";

export { normalizarSlug, SLUGS_RESERVADOS } from "./slug";

export type Asistencia = "pendiente" | "si" | "no";

export type Familia = {
  id: string;
  slug: string;
  nombre: string;
  /** Nombres de cada persona invitada; un boleto por persona. */
  invitados: string[];
  asistencia: Asistencia;
  /** Quiénes confirmaron (subconjunto de `invitados`). */
  asistentes: string[] | null;
  mensaje: string | null;
  telefono: string | null;
  confirmado_at: string | null;
  created_at: string;
};

export type Confirmacion = {
  asistencia: Exclude<Asistencia, "pendiente">;
  asistentes: string[];
  mensaje: string | null;
  /** Solo se guarda si la familia escribió uno; si no, se conserva el que capturó el admin. */
  telefono?: string;
};

export type DatosFamilia = {
  slug: string;
  nombre: string;
  telefono: string | null;
  invitados: string[];
};


export const supabaseConfigurado = Boolean(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

let cliente: SupabaseClient | null = null;

/** Cliente con la service role key: solo servidor, salta RLS. */
function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cliente ??= createClient(url, key, { auth: { persistSession: false } });
  return cliente;
}

// Sin Supabase configurado (desarrollo local) usamos familias de ejemplo en memoria.
// Vive en globalThis para que páginas, acciones y rutas (empaquetadas por separado) compartan los datos.
const global = globalThis as typeof globalThis & { __familiasDemo?: Map<string, Familia> };
const demo = (global.__familiasDemo ??= crearDemo());

function crearDemo() {
  return new Map<string, Familia>(
  (
    [
      ["familia-alba-garcia", "Familia Alba García", ["María Alba", "José Alba", "Ana Alba", "Luis Alba"], "3312345678", null],
      ["familia-garcia-leon", "Familia García León", ["Carmen García", "Pedro García", "Sofía García"], "3398765432", ["Carmen García", "Pedro García"]],
      ["familia-rodriguez", "Familia Rodríguez", ["Elena Rodríguez", "Tomás Rodríguez"], null, []],
      ["demo", "Familia Ejemplo", ["Juan Pérez", "Laura Gómez", "Diego Pérez", "Valeria Pérez"], null, null],
    ] as const
  ).map(([slug, nombre, invitados, telefono, asistentes], i) => [
    slug,
    {
      id: slug,
      slug,
      nombre,
      invitados: [...invitados],
      asistencia: asistentes === null ? "pendiente" : asistentes.length ? "si" : "no",
      asistentes: asistentes === null ? null : [...asistentes],
      mensaje: asistentes?.length ? "¡Ahí estaremos, muchas felicidades!" : null,
      telefono,
      confirmado_at: asistentes === null ? null : new Date(Date.now() - i * 86_400_000).toISOString(),
      created_at: new Date(Date.now() - (10 - i) * 86_400_000).toISOString(),
    },
  ]),
  );
}

function error(accion: string, e: { message: string; code?: string }) {
  if (e.code === "23505") return new Error("Ya existe una familia con ese enlace.");
  return new Error(`No se pudo ${accion}: ${e.message}`);
}

export async function obtenerFamilia(slugCrudo: string): Promise<Familia | null> {
  const slug = normalizarSlug(slugCrudo);
  if (!slug) return null;

  const db = supabase();
  if (!db) return demo.get(slug) ?? null;

  const { data, error: e } = await db.from("familias").select("*").eq("slug", slug).maybeSingle();
  if (e) throw error("leer la familia", e);
  return data as Familia | null;
}

export async function guardarConfirmacion(slug: string, datos: Confirmacion) {
  const cambios = { ...datos, confirmado_at: new Date().toISOString() };

  const db = supabase();
  if (!db) {
    const familia = demo.get(slug);
    if (familia) demo.set(slug, { ...familia, ...cambios });
    return;
  }

  const { error: e } = await db.from("familias").update(cambios).eq("slug", slug);
  if (e) throw error("guardar la confirmación", e);
}

// ——— Administración (solo llamar después de verificar al admin) ———

/** Si la familia ya respondió, el estado se recalcula con la lista de confirmados. */
function estadoDe(asistentes: string[] | null): { asistencia?: Asistencia } {
  return asistentes === null ? {} : { asistencia: asistentes.length ? "si" : "no" };
}

export async function listarFamilias(): Promise<Familia[]> {
  const db = supabase();
  if (!db) return [...demo.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const { data, error: e } = await db.from("familias").select("*").order("nombre");
  if (e) throw error("listar las familias", e);
  return data as Familia[];
}

export async function crearFamilia(datos: DatosFamilia) {
  const db = supabase();
  if (!db) {
    if (demo.has(datos.slug)) throw new Error("Ya existe una familia con ese enlace.");
    demo.set(datos.slug, {
      ...datos,
      id: datos.slug,
      asistencia: "pendiente",
      asistentes: null,
      mensaje: null,
      confirmado_at: null,
      created_at: new Date().toISOString(),
    });
    return;
  }

  const { error: e } = await db.from("familias").insert(datos);
  if (e) throw error("crear la familia", e);
}

export async function actualizarFamilia(id: string, datos: DatosFamilia) {
  const db = supabase();
  if (!db) {
    const actual = [...demo.values()].find((f) => f.id === id);
    if (!actual) throw new Error("La familia ya no existe.");
    if (datos.slug !== actual.slug && demo.has(datos.slug)) {
      throw new Error("Ya existe una familia con ese enlace.");
    }
    // Si quitan a alguien de la lista, también sale de los confirmados.
    const asistentes = actual.asistentes?.filter((n) => datos.invitados.includes(n)) ?? null;
    demo.delete(actual.slug);
    demo.set(datos.slug, { ...actual, ...datos, id: datos.slug, asistentes, ...estadoDe(asistentes) });
    return;
  }

  const { data: actual, error: e1 } = await db
    .from("familias")
    .select("asistentes")
    .eq("id", id)
    .maybeSingle();
  if (e1) throw error("leer la familia", e1);
  if (!actual) throw new Error("La familia ya no existe.");

  const asistentes =
    (actual.asistentes as string[] | null)?.filter((n) => datos.invitados.includes(n)) ?? null;
  const { error: e2 } = await db
    .from("familias")
    .update({ ...datos, asistentes, ...estadoDe(asistentes) })
    .eq("id", id);
  if (e2) throw error("actualizar la familia", e2);
}

export async function eliminarFamilia(id: string) {
  const db = supabase();
  if (!db) {
    const actual = [...demo.values()].find((f) => f.id === id);
    if (actual) demo.delete(actual.slug);
    return;
  }

  const { error: e } = await db.from("familias").delete().eq("id", id);
  if (e) throw error("eliminar la familia", e);
}

/**
 * Consulta mínima para que Supabase registre actividad: el plan gratis pausa
 * los proyectos tras 7 días sin uso. La llama el cron de Vercel (vercel.json).
 */
export async function tocarBaseDeDatos() {
  const db = supabase();
  if (!db) return { supabase: false, familias: demo.size };

  const { count, error: e } = await db.from("familias").select("id", { count: "exact", head: true });
  if (e) throw error("consultar Supabase", e);
  return { supabase: true, familias: count ?? 0 };
}
