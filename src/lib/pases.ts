import type { Familia } from "./familias";

/** Personas que se esperan en la puerta: las confirmadas o, si no respondieron, todas las invitadas. */
export function esperadosDe(f: Familia) {
  if (f.asistencia === "si") return f.asistentes ?? [];
  if (f.asistencia === "no") return [];
  return f.invitados;
}
