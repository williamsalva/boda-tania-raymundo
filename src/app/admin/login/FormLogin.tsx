"use client";

import { AlertCircle } from "lucide-react";
import { useActionState } from "react";
import { iniciarSesion } from "../acciones";

const campo =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 outline-none transition-shadow placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";

export function FormLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, null);

  return (
    <form action={accion} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block font-medium text-zinc-900">Correo</span>
        <input name="email" type="email" autoComplete="email" placeholder="tu@correo.com" required className={campo} />
      </label>
      <label className="block">
        <span className="mb-1.5 block font-medium text-zinc-900">Contraseña</span>
        <input name="password" type="password" autoComplete="current-password" required className={campo} />
      </label>
      {estado?.error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-700">
          <AlertCircle className="size-4 shrink-0" />
          {estado.error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="w-full cursor-pointer rounded-lg bg-zinc-900 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
