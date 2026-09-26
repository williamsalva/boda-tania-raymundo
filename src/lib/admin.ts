import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { supabaseConfigurado } from "./familias";
import { clienteAuth } from "./supabase/servidor";

const authConfigurado = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** En local sin Supabase el panel funciona sin login, con las familias de ejemplo. Nunca en producción. */
export const modoDemoAdmin =
  !authConfigurado && !supabaseConfigurado && process.env.NODE_ENV !== "production";

export function correoPermitido(correo: string) {
  const permitidos = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  return permitidos.includes(correo.toLowerCase());
}

/** El admin de esta petición, o null. Verifica la sesión contra el servidor de Supabase. */
export const obtenerAdmin = cache(async (): Promise<{ email: string } | null> => {
  // El panel nunca se prerenderiza: siempre depende de la sesión y de datos al momento.
  await connection();
  if (modoDemoAdmin) return { email: "modo demo" };

  const supabase = await clienteAuth();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !correoPermitido(user.email)) return null;
  return { email: user.email };
});

/** Para páginas y acciones del panel: sin admin válido, al login. */
export async function exigirAdmin() {
  const admin = await obtenerAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
