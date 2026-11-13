import type { Asistencia } from "@/lib/familias";

/** Todo lo que la app de la entrada necesita saber de una invitación, ya resuelto en el servidor. */
export type Pase = {
  id: string;
  codigo: string;
  nombre: string;
  asistencia: Asistencia;
  invitados: string[];
  /** Quienes se espera que lleguen: confirmados, o toda la invitación si no respondieron. */
  esperados: string[];
  llegaron: string[];
  llegadaAt: string | null;
  mensaje: string | null;
  /** Nombre de la mesa de cada invitado ("" si no tiene). */
  mesaDe: Record<string, string>;
};

export type Tono = "ok" | "aviso" | "alto";

/** El pase vale para tantas personas como se esperan; se puede usar en varias entradas hasta llenarlo. */
export const cupoDe = (p: Pase) => p.esperados.length;
export const quedanDe = (p: Pase) => Math.max(0, cupoDe(p) - p.llegaron.length);
/** Esperados que aún no entran, limitados a los lugares que quedan en el pase. */
export const faltanDe = (p: Pase) => p.esperados.filter((n) => !p.llegaron.includes(n)).slice(0, quedanDe(p));

export const hora = (fecha: string) =>
  new Date(fecha).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "America/Mexico_City" });

export const personas = (n: number) => `${n} ${n === 1 ? "persona" : "personas"}`;
export const lugares = (n: number) => `${n} ${n === 1 ? "lugar" : "lugares"}`;

/** Lo primero que ve la planner al escanear: ¿pasa o no pasa? */
export function evaluar(p: Pase): { tono: Tono; titulo: string; detalle: string } {
  const cupo = cupoDe(p);
  const quedan = quedanDe(p);
  if (cupo === 0) {
    return {
      tono: "alto",
      titulo: "Pase sin lugares",
      detalle: "Respondieron que no asistirían. Para dejarlos pasar, los novios deben cambiar su confirmación.",
    };
  }
  if (quedan === 0) {
    return {
      tono: "alto",
      titulo: "Pase ya usado",
      detalle: `No quedan lugares: entraron ${p.llegaron.length} de ${cupo}${p.llegadaAt ? ` (desde las ${hora(p.llegadaAt)})` : ""}`,
    };
  }
  if (p.asistencia === "pendiente" && !p.llegaron.length) {
    return {
      tono: "aviso",
      titulo: "Sin confirmar",
      detalle: `No respondieron la invitación (${personas(cupo)}). Consulta con los novios antes de darles acceso.`,
    };
  }
  if (p.llegaron.length) {
    return {
      tono: "aviso",
      titulo: `Ya entraron ${p.llegaron.length} de ${cupo}`,
      detalle: `${quedan === 1 ? "Queda" : "Quedan"} ${lugares(quedan)} en este pase.${p.asistencia === "pendiente" ? " Familia sin confirmar." : ""}`,
    };
  }
  return { tono: "ok", titulo: "Pase válido", detalle: `Para ${personas(cupo)}.` };
}

/** Agrupa nombres por mesa, en orden de mesa y con los que no tienen mesa al final. */
export function porMesa(p: Pase, nombres: string[]) {
  const grupos = new Map<string, string[]>();
  for (const n of nombres) {
    const mesa = p.mesaDe[n] ?? "";
    grupos.set(mesa, [...(grupos.get(mesa) ?? []), n]);
  }
  return [...grupos]
    .map(([mesa, nombres]) => ({ mesa, nombres }))
    .sort((a, b) => (!a.mesa ? 1 : !b.mesa ? -1 : a.mesa.localeCompare(b.mesa, "es", { numeric: true })));
}

export const mesasTexto = (p: Pase) =>
  porMesa(p, p.esperados.length ? p.esperados : p.invitados)
    .map((g) => g.mesa)
    .filter(Boolean)
    .join(" · ");
