"use server";

import { revalidatePath } from "next/cache";
import { guardarConfirmacion, obtenerFamilia } from "@/lib/familias";

export type EstadoRsvp = {
  ok: boolean;
  error?: string;
};

function texto(valor: FormDataEntryValue | null, max: number) {
  const limpio = typeof valor === "string" ? valor.trim().slice(0, max) : "";
  return limpio || null;
}

export async function confirmarAsistencia(
  _prev: EstadoRsvp | null,
  formData: FormData,
): Promise<EstadoRsvp> {
  const slug = String(formData.get("slug") ?? "");
  const familia = await obtenerFamilia(slug);
  if (!familia) return { ok: false, error: "No encontramos tu invitación." };

  // Solo aceptamos nombres que realmente están en la invitación de esta familia.
  const marcados = new Set(formData.getAll("asistentes").map(String));
  const asistentes = familia.invitados.filter((nombre) => marcados.has(nombre));

  try {
    await guardarConfirmacion(familia.slug, {
      asistencia: asistentes.length > 0 ? "si" : "no",
      asistentes,
      mensaje: texto(formData.get("mensaje"), 1000),
      telefono: texto(formData.get("telefono"), 30) ?? undefined,
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Algo salió mal. Intenta de nuevo en un momento." };
  }

  revalidatePath(`/${familia.slug}`);
  return { ok: true };
}
