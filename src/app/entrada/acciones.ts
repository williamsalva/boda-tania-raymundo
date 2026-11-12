"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  abrirSesionEntrada,
  cerrarSesionEntrada,
  exigirEntrada,
  pinCorrecto,
} from "@/lib/entrada";
import { registrarLlegada } from "@/lib/familias";

export type Resultado = { ok: boolean; error?: string } | null;

/** Solo regresamos a rutas de la propia entrada. */
const destino = (v: FormDataEntryValue | null) =>
  typeof v === "string" && /^\/entrada(\/[0-9a-f-]{36})?$/i.test(v) ? v : "/entrada";

export async function entrarConPin(_prev: Resultado, formData: FormData): Promise<Resultado> {
  const intento = String(formData.get("pin") ?? "").slice(0, 40);
  if (!pinCorrecto(intento)) {
    // Frena a quien intente adivinar el PIN.
    await new Promise((r) => setTimeout(r, 1200));
    return { ok: false, error: "PIN incorrecto." };
  }
  await abrirSesionEntrada();
  redirect(destino(formData.get("volver")));
}

export async function guardarLlegada(id: string, llegaron: string[]): Promise<Resultado> {
  await exigirEntrada();
  try {
    await registrarLlegada(
      id.slice(0, 100),
      llegaron.slice(0, 50).map((n) => String(n).slice(0, 80)),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
  revalidatePath("/entrada", "layout");
  return { ok: true };
}

export async function salirEntrada() {
  await cerrarSesionEntrada();
  redirect("/entrada");
}
