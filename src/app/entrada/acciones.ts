"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  abrirSesionEntrada,
  cerrarSesionEntrada,
  exigirEntrada,
  pinCorrecto,
} from "@/lib/entrada";
import { registrarLlegada, type CambioLlegada } from "@/lib/familias";

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

export type ResultadoLlegada =
  | { ok: true; llegaron: string[]; llegadaAt: string | null }
  | { ok: false; error: string };

const nombres = (l: string[] | undefined) => (l ?? []).slice(0, 50).map((n) => String(n).slice(0, 80));

export async function guardarLlegada(id: string, cambio: CambioLlegada): Promise<ResultadoLlegada> {
  await exigirEntrada();
  try {
    const r = await registrarLlegada(id.slice(0, 100), { agregar: nombres(cambio.agregar), quitar: nombres(cambio.quitar) });
    revalidatePath("/entrada", "layout");
    return { ok: true, llegaron: r.llegaron, llegadaAt: r.llegada_at };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
}

export async function salirEntrada() {
  await cerrarSesionEntrada();
  redirect("/entrada");
}
