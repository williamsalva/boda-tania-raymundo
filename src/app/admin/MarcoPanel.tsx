import { Armchair, CalendarHeart, Download, ExternalLink, LogOut, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { modoDemoAdmin } from "@/lib/admin";
import { FECHA_BODA } from "@/lib/boda";
import { cerrarSesion } from "./acciones";
import { Logo } from "./Logo";

type Seccion = "invitados" | "mesas";

const SECCIONES: { id: Seccion; texto: string; href: string; icono: ReactNode }[] = [
  { id: "invitados", texto: "Invitados", href: "/admin", icono: <Users className="size-4" /> },
  { id: "mesas", texto: "Mesas", href: "/admin/mesas", icono: <Armchair className="size-4" /> },
];

function diasPara(fecha: string) {
  return Math.max(0, Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000));
}

function Salir({ className }: { className: string }) {
  if (modoDemoAdmin) return null;
  return (
    <form action={cerrarSesion}>
      <button title="Cerrar sesión" className={className}>
        <LogOut className="size-4" />
      </button>
    </form>
  );
}

/** Estructura común del panel: barra lateral en escritorio y barra superior con pestañas en móvil. */
export function MarcoPanel({ activo, email, children }: { activo: Seccion; email: string; children: ReactNode }) {
  const diasBoda = diasPara(FECHA_BODA);

  return (
    <div className="lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-[100svh] flex-col border-r border-zinc-200 bg-white px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <Logo className="size-9" />
          <div className="leading-tight">
            <p className="font-semibold text-zinc-900">Tania & Raymundo</p>
            <p className="text-xs text-zinc-500">11 dic 2026 · Guadalajara</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1">
          {SECCIONES.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${
                activo === s.id ? "bg-zinc-100 font-medium text-zinc-900" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              {s.icono} {s.texto}
            </Link>
          ))}
          <div className="my-3 border-t border-zinc-100" />
          <a href="/" target="_blank" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
            <ExternalLink className="size-4" /> Ver invitación
          </a>
          <a href="/admin/exportar" download className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
            <Download className="size-4" /> Exportar a Excel
          </a>
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="flex items-center gap-2 text-xs text-zinc-500">
              <CalendarHeart className="size-3.5" /> Cuenta regresiva
            </p>
            <p className="mt-1 text-zinc-900">
              <span className="num text-lg font-semibold">{diasBoda}</span> días para la boda
            </p>
          </div>
          <div className="flex items-center gap-2 border-t border-zinc-200 px-1 pt-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-medium uppercase text-zinc-600">
              {email.slice(0, 2)}
            </span>
            <p className="min-w-0 flex-1 truncate text-xs text-zinc-600">{email}</p>
            <Salir className="grid size-8 cursor-pointer place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <Logo className="size-8" />
            <p className="flex-1 font-semibold">Tania & Raymundo</p>
            <span className="num rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">{diasBoda} días</span>
            <a href="/admin/exportar" download title="Exportar a Excel" className="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">
              <Download className="size-4" />
            </a>
            <Salir className="grid size-8 cursor-pointer place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100" />
          </div>
          <nav className="flex gap-1 px-3 pb-2">
            {SECCIONES.map((s) => (
              <Link
                key={s.id}
                href={s.href}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 ${
                  activo === s.id ? "bg-zinc-100 font-medium text-zinc-900" : "text-zinc-500"
                }`}
              >
                {s.icono} {s.texto}
              </Link>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
          {modoDemoAdmin && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-500" />
              <p>
                <strong className="font-semibold">Modo demo.</strong> Supabase no está configurado: el panel usa
                datos de ejemplo en memoria y no pide login. Los cambios se pierden al reiniciar.
              </p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
