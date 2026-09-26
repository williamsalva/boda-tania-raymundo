"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { correoPermitido, exigirAdmin } from "@/lib/admin";
import {
  SLUGS_RESERVADOS,
  actualizarFamilia,
  crearFamilia,
  eliminarFamilia,
  normalizarSlug,
} from "@/lib/familias";
import { clienteAuth } from "@/lib/supabase/servidor";

export type Resultado = { ok: boolean; error?: string } | null;

function texto(valor: FormDataEntryValue | null, max: number) {
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

export async function guardarFamilia(_prev: Resultado, formData: FormData): Promise<Resultado> {
  await exigirAdmin();

  const id = texto(formData.get("id"), 100);
  const nombre = texto(formData.get("nombre"), 120);
  if (!nombre) return { ok: false, error: "Escribe el nombre de la familia." };

  const slug = normalizarSlug(texto(formData.get("slug"), 120) || nombre);
  if (!slug) return { ok: false, error: "El enlace no es válido." };
  if (SLUGS_RESERVADOS.has(slug)) return { ok: false, error: `"${slug}" está reservado; usa otro enlace.` };

  const telefono = texto(formData.get("telefono"), 25).replace(/[^\d+\s()-]/g, "") || null;

  const invitados = [
    ...new Set(
      formData
        .getAll("invitados")
        .map((n) => texto(n, 80).replace(/\s+/g, " "))
        .filter(Boolean),
    ),
  ];
  if (invitados.length === 0) return { ok: false, error: "Agrega al menos un invitado." };
  if (invitados.length > 40) return { ok: false, error: "Máximo 40 invitados por familia." };

  try {
    const datos = { slug, nombre, telefono, invitados };
    if (id) await actualizarFamilia(id, datos);
    else await crearFamilia(datos);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar." };
  }

  revalidatePath("/admin");
  revalidatePath(`/${slug}`);
  return { ok: true };
}

export async function borrarFamilia(formData: FormData) {
  await exigirAdmin();
  const id = texto(formData.get("id"), 100);
  if (id) await eliminarFamilia(id);
  revalidatePath("/admin");
}

export async function iniciarSesion(_prev: Resultado, formData: FormData): Promise<Resultado> {
  const supabase = await clienteAuth();
  if (!supabase) return { ok: false, error: "Supabase no está configurado todavía." };

  const email = texto(formData.get("email"), 200).toLowerCase();
  const password = texto(formData.get("password"), 200);
  if (!email || !password) return { ok: false, error: "Escribe tu correo y contraseña." };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user?.email) return { ok: false, error: "Correo o contraseña incorrectos." };

  if (!correoPermitido(data.user.email)) {
    await supabase.auth.signOut();
    return { ok: false, error: "Esta cuenta no tiene acceso al panel." };
  }

  redirect("/admin");
}

export async function cerrarSesion() {
  const supabase = await clienteAuth();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}
