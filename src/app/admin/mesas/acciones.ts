"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin";
import { listarFamilias } from "@/lib/familias";
import {
  CAPACIDAD_DEFAULT,
  actualizarMesa,
  crearMesas,
  eliminarMesa,
  listarMesas,
  moverPersonas,
  type Persona,
} from "@/lib/mesas";

export type ResultadoMesa = { ok: true } | { ok: false; error: string };

function capacidadValida(valor: unknown) {
  const n = Math.round(Number(valor));
  return Number.isFinite(n) ? Math.min(50, Math.max(1, n)) : CAPACIDAD_DEFAULT;
}

async function intentar(fn: () => Promise<void>): Promise<ResultadoMesa> {
  await exigirAdmin();
  try {
    await fn();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Algo salió mal." };
  }
  revalidatePath("/admin/mesas");
  return { ok: true };
}

export async function agregarMesas(cuantas: number, capacidad: number) {
  return intentar(() => crearMesas(Math.min(30, Math.max(1, Math.round(cuantas) || 1)), capacidadValida(capacidad)));
}

export async function editarMesa(id: string, nombre: string, capacidad: number) {
  return intentar(async () => {
    const limpio = String(nombre).trim().slice(0, 40);
    if (!limpio) throw new Error("La mesa necesita un nombre.");
    await actualizarMesa(String(id), { nombre: limpio, capacidad: capacidadValida(capacidad) });
  });
}

export async function borrarMesa(id: string) {
  return intentar(() => eliminarMesa(String(id)));
}

/** Sienta (o levanta, con mesaId null) a invitados que existan de verdad en sus familias. */
export async function mover(mesaId: string | null, personas: Persona[]) {
  return intentar(async () => {
    if (!Array.isArray(personas) || personas.length > 300) throw new Error("Selección inválida.");
    if (mesaId && !(await listarMesas()).some((m) => m.id === mesaId)) throw new Error("La mesa ya no existe.");

    const familias = new Map((await listarFamilias()).map((f) => [f.id, f]));
    const validas = personas.filter((p) => familias.get(String(p?.familia_id))?.invitados.includes(String(p?.invitado)));
    await moverPersonas(
      mesaId,
      validas.map((p) => ({ familia_id: String(p.familia_id), invitado: String(p.invitado) })),
    );
  });
}
