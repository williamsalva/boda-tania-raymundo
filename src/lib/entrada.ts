import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { modoDemoAdmin, obtenerAdmin } from "./admin";

// Acceso de la wedding planner a /entrada: un PIN (variable ENTRADA_PIN) que deja una cookie firmada.
// Los admins del panel también entran sin PIN.

export const COOKIE_ENTRADA = "pase_entrada";
const DURACION = 60 * 60 * 24 * 30; // 30 días

const pin = () => process.env.ENTRADA_PIN?.trim() || null;

/** Sin PIN configurado en local, la entrada funciona abierta (igual que el panel en modo demo). */
export const entradaAbierta = () => !pin() && modoDemoAdmin;
export const entradaConfigurada = () => Boolean(pin()) || entradaAbierta();

/** Valor de la cookie: depende del PIN, así que cambiar el PIN cierra todas las sesiones. */
function firma() {
  return createHmac("sha256", pin() ?? "").update("entrada-boda-v1").digest("hex");
}

function iguales(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function pinCorrecto(intento: string) {
  const actual = pin();
  return Boolean(actual) && iguales(intento.trim(), actual!);
}

export async function abrirSesionEntrada() {
  (await cookies()).set(COOKIE_ENTRADA, firma(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/entrada",
    maxAge: DURACION,
  });
}

export async function cerrarSesionEntrada() {
  (await cookies()).delete({ name: COOKIE_ENTRADA, path: "/entrada" });
}

export async function tieneAccesoEntrada() {
  await connection();
  if (entradaAbierta()) return true;
  const cookie = (await cookies()).get(COOKIE_ENTRADA)?.value;
  if (pin() && cookie && iguales(cookie, firma())) return true;
  return Boolean(await obtenerAdmin());
}

/** Para páginas y acciones de /entrada: sin acceso, al PIN. */
export async function exigirEntrada() {
  if (!(await tieneAccesoEntrada())) redirect("/entrada");
}
