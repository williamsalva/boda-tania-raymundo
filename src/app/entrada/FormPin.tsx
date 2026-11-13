"use client";

import { LockKeyhole } from "lucide-react";
import { useActionState } from "react";
import { entrarConPin } from "./acciones";

export function FormPin({ volver }: { volver: string }) {
  const [estado, accion, enviando] = useActionState(entrarConPin, null);

  return (
    <form action={accion} className="flex min-h-[100svh] flex-col justify-center py-10">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-rose-500/15 text-rose-300">
        <LockKeyhole className="size-6" />
      </span>
      <p className="mt-5 text-center text-[0.75rem] font-medium uppercase tracking-[0.18em] text-rose-300/80">Tania & Raymundo</p>
      <h1 className="mt-1 text-center text-2xl font-semibold text-white">Entrada del salón</h1>
      <p className="mx-auto mt-2 max-w-xs text-center text-zinc-400">Escribe el PIN que te dieron los novios para registrar a los invitados.</p>
      <input type="hidden" name="volver" value={volver} />
      <input
        name="pin"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        aria-label="PIN"
        autoFocus
        required
        placeholder="• • • •"
        className="num mt-8 h-16 w-full rounded-2xl bg-white/[0.07] text-center text-3xl tracking-[0.5em] text-white outline-none ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-2 focus:ring-rose-400/60"
      />
      {estado?.error && <p className="mt-3 text-center font-medium text-rose-400">{estado.error}</p>}
      <button
        disabled={enviando}
        className="mt-4 h-14 w-full cursor-pointer rounded-2xl bg-white text-[1.05rem] font-semibold text-zinc-900 active:scale-[0.98] disabled:opacity-60"
      >
        {enviando ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}
