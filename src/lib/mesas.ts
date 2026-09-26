import "server-only";
import { supabase } from "./familias";

export type Mesa = {
  id: string;
  nombre: string;
  capacidad: number;
  orden: number;
};

/** Un invitado sentado: se identifica por su familia y su nombre dentro de ella. */
export type Asiento = {
  familia_id: string;
  invitado: string;
  mesa_id: string;
};

export type Persona = { familia_id: string; invitado: string };

export const CAPACIDAD_DEFAULT = 12;

// ——— Modo demo (sin Supabase): en memoria y compartido entre módulos ———
const global = globalThis as typeof globalThis & {
  __mesasDemo?: Mesa[];
  __asientosDemo?: Asiento[];
};
const mesasDemo = () => (global.__mesasDemo ??= []);
const asientosDemo = () => (global.__asientosDemo ??= []);

function error(accion: string, e: { message: string }) {
  return new Error(`No se pudo ${accion}: ${e.message}`);
}

export async function listarMesas(): Promise<Mesa[]> {
  const db = supabase();
  if (!db) return [...mesasDemo()].sort((a, b) => a.orden - b.orden);

  const { data, error: e } = await db.from("mesas").select("id, nombre, capacidad, orden").order("orden");
  if (e) throw error("listar las mesas", e);
  return data as Mesa[];
}

export async function listarAsientos(): Promise<Asiento[]> {
  const db = supabase();
  if (!db) return [...asientosDemo()];

  const { data, error: e } = await db.from("asientos").select("familia_id, invitado, mesa_id");
  if (e) throw error("listar los asientos", e);
  return data as Asiento[];
}

/** Crea `cuantas` mesas nuevas al final, numeradas a partir de las existentes. */
export async function crearMesas(cuantas: number, capacidad: number) {
  const actuales = await listarMesas();
  const siguiente = actuales.reduce((m, x) => Math.max(m, x.orden), 0) + 1;
  const nuevas = Array.from({ length: cuantas }, (_, i) => ({
    nombre: `Mesa ${siguiente + i}`,
    capacidad,
    orden: siguiente + i,
  }));

  const db = supabase();
  if (!db) {
    mesasDemo().push(...nuevas.map((m) => ({ ...m, id: crypto.randomUUID() })));
    return;
  }
  const { error: e } = await db.from("mesas").insert(nuevas);
  if (e) throw error("crear las mesas", e);
}

export async function actualizarMesa(id: string, cambios: { nombre: string; capacidad: number }) {
  const db = supabase();
  if (!db) {
    const mesa = mesasDemo().find((m) => m.id === id);
    if (mesa) Object.assign(mesa, cambios);
    return;
  }
  const { error: e } = await db.from("mesas").update(cambios).eq("id", id);
  if (e) throw error("actualizar la mesa", e);
}

/** Borra la mesa; sus invitados vuelven a quedar sin mesa. */
export async function eliminarMesa(id: string) {
  const db = supabase();
  if (!db) {
    global.__mesasDemo = mesasDemo().filter((m) => m.id !== id);
    global.__asientosDemo = asientosDemo().filter((a) => a.mesa_id !== id);
    return;
  }
  const { error: e } = await db.from("mesas").delete().eq("id", id);
  if (e) throw error("eliminar la mesa", e);
}

/** Sienta a las personas en la mesa (o las levanta si `mesaId` es null). */
export async function moverPersonas(mesaId: string | null, personas: Persona[]) {
  if (personas.length === 0) return;
  const db = supabase();

  if (!db) {
    const clave = (p: Persona) => `${p.familia_id}::${p.invitado}`;
    const mover = new Set(personas.map(clave));
    const resto = asientosDemo().filter((a) => !mover.has(clave(a)));
    global.__asientosDemo = mesaId ? [...resto, ...personas.map((p) => ({ ...p, mesa_id: mesaId }))] : resto;
    return;
  }

  if (mesaId) {
    const { error: e } = await db
      .from("asientos")
      .upsert(personas.map((p) => ({ ...p, mesa_id: mesaId })), { onConflict: "familia_id,invitado" });
    if (e) throw error("sentar a los invitados", e);
    return;
  }

  // Levantar: agrupamos por familia para borrar en pocas llamadas.
  const porFamilia = new Map<string, string[]>();
  for (const p of personas) porFamilia.set(p.familia_id, [...(porFamilia.get(p.familia_id) ?? []), p.invitado]);
  for (const [familia_id, nombres] of porFamilia) {
    const { error: e } = await db.from("asientos").delete().eq("familia_id", familia_id).in("invitado", nombres);
    if (e) throw error("quitar a los invitados de la mesa", e);
  }
}
