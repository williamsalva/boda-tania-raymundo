import { obtenerAdmin } from "@/lib/admin";
import { listarFamilias } from "@/lib/familias";

const ESTADO = { pendiente: "Pendiente", si: "Asistirá", no: "No asistirá" } as const;

function celda(valor: string | null | undefined) {
  const v = valor ?? "";
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Lista persona por persona en CSV (abre directo en Excel). */
export async function GET(request: Request) {
  if (!(await obtenerAdmin())) return new Response("No autorizado", { status: 401 });

  const origen = new URL(request.url).origin;
  const filas = [["Familia", "Invitado", "Estado", "Teléfono", "Enlace", "Mensaje"]];
  for (const f of await listarFamilias()) {
    for (const invitado of f.invitados) {
      const estado =
        f.asistencia === "pendiente" ? "pendiente" : f.asistentes?.includes(invitado) ? "si" : "no";
      filas.push([f.nombre, invitado, ESTADO[estado], f.telefono ?? "", `${origen}/${f.slug}`, f.mensaje ?? ""]);
    }
  }

  const csv = "﻿" + filas.map((fila) => fila.map(celda).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="invitados-tania-raymundo.csv"',
      "Cache-Control": "no-store",
    },
  });
}
