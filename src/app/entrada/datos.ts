import "server-only";
import { listarFamilias } from "@/lib/familias";
import { listarAsientos, listarMesas } from "@/lib/mesas";
import { esperadosDe } from "@/lib/pases";
import type { Pase } from "./tipos";

/**
 * Todas las invitaciones con sus mesas. Son pocas (~100), así que van completas al teléfono:
 * al escanear, la ficha aparece al instante sin esperar a la red.
 */
export async function cargarPases(): Promise<Pase[]> {
  const [familias, mesas, asientos] = await Promise.all([listarFamilias(), listarMesas(), listarAsientos()]);
  const nombreMesa = new Map(mesas.map((m) => [m.id, m.nombre]));
  const mesasPorFamilia = new Map<string, Record<string, string>>();
  for (const a of asientos) {
    const m = mesasPorFamilia.get(a.familia_id) ?? {};
    m[a.invitado] = nombreMesa.get(a.mesa_id) ?? "";
    mesasPorFamilia.set(a.familia_id, m);
  }

  return familias.map((f) => ({
    id: f.id,
    codigo: f.codigo,
    nombre: f.nombre,
    asistencia: f.asistencia,
    invitados: f.invitados,
    esperados: esperadosDe(f),
    llegaron: f.llegaron,
    llegadaAt: f.llegada_at,
    mensaje: f.mensaje,
    mesaDe: mesasPorFamilia.get(f.id) ?? {},
  }));
}
