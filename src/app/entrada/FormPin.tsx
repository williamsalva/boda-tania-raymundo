"use client";

import { LockKeyhole } from "lucide-react";
import { useActionState } from "react";
import { entrarConPin } from "./acciones";

export function FormPin({ volver }: { volver: string }) {
  const [estado, accion, enviando] = useActionState(entrarConPin, null);

  return (
    <form action={accion} className="mt-16 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <span className="grid size-11 place-items-center rounded-full bg-rose-50 text-[var(--acento)]">
        <LockKeyhole className="size-5" />
      </span>
      <h1 className="mt-4 text-lg font-semibold">Entrada · Tania & Raymundo</h1>
      <p className="mt-1 text-zinc-500">Escribe el PIN para registrar la llegada de los invitados.</p>
      <input type="hidden" name="volver" value={volver} />
      <input
        name="pin"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        autoFocus
        required
        placeholder="PIN"
        className="num mt-5 w-full rounded-xl border border-zinc-200 px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
      />
      {estado?.error && <p className="mt-3 text-center text-rose-600">{estado.error}</p>}
      <button
        disabled={enviando}
        className="mt-5 w-full cursor-pointer rounded-xl bg-zinc-900 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {enviando ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}
