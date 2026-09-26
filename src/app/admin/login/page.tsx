import Image from "next/image";
import { redirect } from "next/navigation";
import { modoDemoAdmin, obtenerAdmin } from "@/lib/admin";
import { FormLogin } from "./FormLogin";
import { Logo } from "../Logo";

export default async function Login() {
  if (await obtenerAdmin()) redirect("/admin");

  return (
    <main className="grid min-h-[100svh] lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center gap-3">
          <Logo className="size-9" />
          <p className="font-semibold text-zinc-900">Tania & Raymundo</p>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Panel de invitados</h1>
          <p className="mt-1.5 text-zinc-500">Entra para administrar familias y confirmaciones.</p>
          <div className="mt-8">
            {modoDemoAdmin ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900">
                Modo demo: el panel está abierto sin login.
              </p>
            ) : (
              <FormLogin />
            )}
          </div>
        </div>

        <p className="text-xs text-zinc-400">Acceso solo para los novios y su equipo.</p>
      </div>

      <div className="relative hidden lg:block">
        <Image src="/fotos/04.jpg" alt="" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">11 · 12 · 2026 · Guadalajara</p>
          <p className="mt-3 max-w-md font-serif text-3xl italic leading-snug">
            “Después de tantos momentos compartidos, hoy elegimos compartir toda la vida.”
          </p>
        </div>
      </div>
    </main>
  );
}
