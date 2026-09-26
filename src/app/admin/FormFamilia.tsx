"use client";

import { AlertCircle, Link2, Plus, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import type { Familia } from "@/lib/familias";
import { normalizarSlug } from "@/lib/slug";
import { guardarFamilia, type Resultado } from "./acciones";

const campo =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition-shadow placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";

function Etiqueta({ children, ayuda }: { children: React.ReactNode; ayuda?: string }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between">
      <span className="font-medium text-zinc-900">{children}</span>
      {ayuda && <span className="text-xs text-zinc-400">{ayuda}</span>}
    </span>
  );
}

/** Panel lateral para agregar o editar una familia. */
export function FormFamilia({
  familia,
  onCerrar,
  onGuardado,
}: {
  familia?: Familia;
  onCerrar: () => void;
  onGuardado: (nombre: string) => void;
}) {
  const [nombre, setNombre] = useState(familia?.nombre ?? "Familia ");
  // Mientras no lo editen a mano, el enlace se genera del nombre.
  const [slug, setSlug] = useState(familia?.slug ?? "");
  const [slugManual, setSlugManual] = useState(Boolean(familia));
  const [invitados, setInvitados] = useState<string[]>(familia?.invitados.length ? familia.invitados : [""]);
  const lista = useRef<HTMLUListElement>(null);
  const primerCampo = useRef<HTMLInputElement>(null);

  const [estado, accion, guardando] = useActionState(async (prev: Resultado, datos: FormData) => {
    const r = await guardarFamilia(prev, datos);
    if (r?.ok) {
      onGuardado(String(datos.get("nombre")));
      onCerrar();
    }
    return r;
  }, null);

  // Enfocar al abrir y cerrar con Escape (una sola vez, aunque el padre vuelva a renderizar).
  const cerrarRef = useRef(onCerrar);
  useEffect(() => {
    cerrarRef.current = onCerrar;
  });
  useEffect(() => {
    primerCampo.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && cerrarRef.current();
    document.addEventListener("keydown", esc);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.documentElement.style.overflow = "";
    };
  }, []);

  const slugFinal = slugManual ? normalizarSlug(slug) : normalizarSlug(nombre);
  const lugares = invitados.filter((n) => n.trim()).length;

  // Al agregar un invitado, el foco pasa al nuevo campo en cuanto existe.
  const enfocarNuevo = useRef(false);
  useEffect(() => {
    if (!enfocarNuevo.current) return;
    enfocarNuevo.current = false;
    lista.current?.querySelector<HTMLInputElement>("li:last-child input")?.focus();
  }, [invitados.length]);

  function agregarInvitado() {
    enfocarNuevo.current = true;
    setInvitados((l) => [...l, ""]);
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-zinc-900/30 [animation:aparecer_.2s_ease]" onClick={onCerrar} />
      <form
        action={accion}
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-2xl [animation:entrar-derecha_.25s_cubic-bezier(.2,.8,.2,1)]"
      >
        <header className="flex items-start justify-between border-b border-zinc-200 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">{familia ? "Editar familia" : "Nueva familia"}</h2>
            <p className="mt-0.5 text-zinc-500">
              {familia ? "Actualiza sus datos e invitados." : "Se generará un enlace personal para su invitación."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="grid size-8 cursor-pointer place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="size-4" />
          </button>
        </header>

        {familia && <input type="hidden" name="id" value={familia.id} />}

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <label className="block">
            <Etiqueta>Nombre de la familia</Etiqueta>
            <input
              ref={primerCampo}
              name="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              maxLength={120}
              className={campo}
            />
          </label>

          <label className="block">
            <Etiqueta ayuda="Para enviar por WhatsApp">Teléfono</Etiqueta>
            <input
              name="telefono"
              type="tel"
              inputMode="tel"
              defaultValue={familia?.telefono ?? ""}
              placeholder="33 1234 5678"
              maxLength={25}
              className={`${campo} num`}
            />
          </label>

          <label className="block">
            <Etiqueta ayuda="Se genera del nombre">Enlace</Etiqueta>
            <div className="flex items-center overflow-hidden rounded-lg border border-zinc-200 transition-shadow focus-within:border-zinc-400 focus-within:ring-4 focus-within:ring-zinc-100">
              <span className="flex items-center gap-1.5 self-stretch border-r border-zinc-200 bg-zinc-50 px-3 text-zinc-500">
                <Link2 className="size-3.5" />/
              </span>
              <input
                name="slug"
                value={slugManual ? slug : slugFinal}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value);
                }}
                className="min-w-0 flex-1 px-3 py-2 outline-none"
              />
            </div>
            {slugManual && slug !== slugFinal && (
              <p className="mt-1.5 text-xs text-zinc-500">
                Se guardará como <span className="font-medium text-zinc-900">/{slugFinal || "…"}</span>
              </p>
            )}
            {familia && slugFinal !== familia.slug && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700">
                <AlertCircle className="size-3.5" /> El enlace anterior dejará de funcionar.
              </p>
            )}
          </label>

          <div>
            <Etiqueta ayuda={`${lugares} ${lugares === 1 ? "lugar" : "lugares"}`}>Invitados</Etiqueta>
            <ul ref={lista} className="space-y-2">
              {invitados.map((n, i) => (
                <li key={i} className="group flex items-center gap-2">
                  <span className="num w-5 shrink-0 text-right text-xs text-zinc-400">{i + 1}</span>
                  <input
                    name="invitados"
                    value={n}
                    onChange={(e) => setInvitados((l) => l.map((x, j) => (j === i ? e.target.value : x)))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        agregarInvitado();
                      }
                    }}
                    placeholder="Nombre y apellido"
                    maxLength={80}
                    className={campo}
                  />
                  <button
                    type="button"
                    onClick={() => setInvitados((l) => (l.length > 1 ? l.filter((_, j) => j !== i) : [""]))}
                    aria-label={`Quitar invitado ${i + 1}`}
                    className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={agregarInvitado}
              className="ml-7 mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100"
            >
              <Plus className="size-4" /> Agregar invitado
              <kbd className="ml-1 rounded border border-zinc-200 bg-zinc-50 px-1.5 text-[0.7rem] font-normal text-zinc-500">
                Enter
              </kbd>
            </button>
            {familia && familia.asistencia !== "pendiente" && (
              <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                Esta familia ya respondió. Si quitas a alguien, también sale de los confirmados.
              </p>
            )}
          </div>

          {estado?.error && (
            <p role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-700">
              <AlertCircle className="size-4 shrink-0" />
              {estado.error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50/60 px-6 py-4">
          <button
            type="button"
            onClick={onCerrar}
            className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3.5 py-2 font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="cursor-pointer rounded-lg bg-zinc-900 px-3.5 py-2 font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
          >
            {guardando ? "Guardando…" : familia ? "Guardar cambios" : "Agregar familia"}
          </button>
        </footer>
      </form>
    </div>
  );
}
