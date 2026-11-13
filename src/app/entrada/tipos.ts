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

export const faltanDe = (p: Pase) => p.esperados.filter((n) => !p.llegaron.includes(n));

export const hora = (fecha: string) =>
  new Date(fecha).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "America/Mexico_City" });

export const personas = (n: number) => `${n} ${n === 1 ? "persona" : "personas"}`;

/** Lo primero que ve la planner al escanear: ¿pasa o no pasa? */
export function evaluar(p: Pase): { tono: Tono; titulo: string; detalle: string } {
  const faltan = faltanDe(p);
  if (p.asistencia === "no") {
    return { tono: "alto", titulo: "Dijeron que no asistirían", detalle: "Consulta con los novios antes de darles acceso." };
  }
  if (p.llegaron.length && !faltan.length) {
    return {
      tono: "alto",
      titulo: "Pase ya usado",
      detalle: `Ya entraron ${personas(p.llegaron.length)}${p.llegadaAt ? ` · ${hora(p.llegadaAt)}` : ""}`,
    };
  }
  if (p.asistencia === "pendiente") {
    return {
      tono: "aviso",
      titulo: "Sin confirmar",
      detalle: "No respondieron la invitación. Consulta con los novios antes de darles acceso.",
    };
  }
  if (p.llegaron.length) {
    return {
      tono: "aviso",
      titulo: `Ya entraron ${p.llegaron.length} de ${p.esperados.length}`,
      detalle: `Faltan: ${faltan.join(", ")}.`,
    };
  }
  return { tono: "ok", titulo: "Pase válido", detalle: `${personas(p.esperados.length)} confirmadas.` };
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
