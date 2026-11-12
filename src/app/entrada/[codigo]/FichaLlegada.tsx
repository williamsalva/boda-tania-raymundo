"use client";

import { AlertTriangle, ArrowLeft, Armchair, Check, CircleCheck, ScanLine } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { Asistencia } from "@/lib/familias";
import { guardarLlegada } from "../acciones";

type Props = {
  familia: {
    id: string;
    nombre: string;
    asistencia: Asistencia;
    invitados: string[];
    esperados: string[];
    llegaron: string[];
    llegadaAt: string | null;
    mensaje: string | null;
  };
  mesaDe: Record<string, string>;
};

const hora = (fecha: string) =>
  new Date(fecha).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "America/Mexico_City" });

export function FichaLlegada({ familia: f, mesaDe }: Props) {
  const [marcados, setMarcados] = useState(() => new Set(f.llegaron));
  const [guardando, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  // Primero quienes confirmaron, luego el resto de la invitación.
  const otros = f.invitados.filter((n) => !f.esperados.includes(n));
  const yaVinieron = f.llegaron.length > 0;
  const cambio =
    marcados.size !== f.llegaron.length || [...marcados].some((n) => !f.llegaron.includes(n));

  function alternar(nombre: string) {
    setGuardado(false);
    setMarcados((m) => {
      const s = new Set(m);
      if (s.has(nombre)) s.delete(nombre);
      else s.add(nombre);
      return s;
    });
  }

  function guardar(lista: string[]) {
    setError(null);
    iniciar(async () => {
      const r = await guardarLlegada(f.id, lista);
      if (r?.ok) {
        setMarcados(new Set(lista));
        setGuardado(true);
        navigator.vibrate?.(60);
      } else setError(r?.error ?? "No se pudo guardar.");
    });
  }

  const pendientesEsperados = f.esperados.filter((n) => !marcados.has(n));

  return (
    <div>
      <Link href="/entrada" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="size-4" /> Escanear otro
      </Link>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">{f.nombre}</h1>
        <p className="mt-0.5 text-zinc-500">
          {f.asistencia === "si"
            ? `Confirmaron ${f.esperados.length} de ${f.invitados.length}`
            : f.asistencia === "no"
              ? "Respondieron que no asistirían"
              : `No confirmaron · ${f.invitados.length} invitados`}
        </p>

        {yaVinieron && (
          <div className="mt-4 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Este pase ya se usó{f.llegadaAt ? ` a las ${hora(f.llegadaAt)}` : ""}: entraron{" "}
              <b className="num">{f.llegaron.length}</b> de <b className="num">{f.esperados.length || f.invitados.length}</b>.
            </p>
          </div>
        )}
        {f.asistencia !== "si" && (
          <div className="mt-4 flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>Esta familia no tiene confirmación. Consulta con los novios antes de darles acceso.</p>
          </div>
        )}

        <Lista titulo={f.asistencia === "si" ? "Confirmados" : "Invitados"} nombres={f.asistencia === "si" ? f.esperados : f.invitados} marcados={marcados} mesaDe={mesaDe} onAlternar={alternar} />
        {f.asistencia === "si" && otros.length > 0 && (
          <Lista titulo="No confirmaron" nombres={otros} marcados={marcados} mesaDe={mesaDe} onAlternar={alternar} tenue />
        )}

        {error && <p className="mt-4 text-center text-rose-600">{error}</p>}

        <div className="mt-5 grid gap-2">
          {pendientesEsperados.length > 0 && (
            <button
              disabled={guardando}
              onClick={() => guardar([...new Set([...marcados, ...f.esperados])])}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <CircleCheck className="size-5" />
              {marcados.size === 0
                ? `Llegaron todos (${f.esperados.length})`
                : `Marcar a los ${pendientesEsperados.length} que faltan`}
            </button>
          )}
          {cambio && (
            <button
              disabled={guardando}
              onClick={() => guardar([...marcados])}
              className="cursor-pointer rounded-xl bg-zinc-900 py-3.5 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {guardando ? "Guardando…" : `Guardar llegada (${marcados.size})`}
            </button>
          )}
        </div>

        {!cambio && marcados.size > 0 && (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800 [animation:aparecer_.15s_ease]">
            <p className="flex items-center gap-2 font-medium">
              <Check className="size-4" /> {guardado ? "Llegada registrada" : "Registrados"} · {marcados.size}{" "}
              {marcados.size === 1 ? "persona" : "personas"}
            </p>
            <Link href="/entrada" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-zinc-900 shadow-sm">
              <ScanLine className="size-4" /> Escanear siguiente
            </Link>
          </div>
        )}
      </div>

      {f.mensaje && <p className="mt-4 px-1 italic text-zinc-500">“{f.mensaje}”</p>}
    </div>
  );
}

function Lista({
  titulo,
  nombres,
  marcados,
  mesaDe,
  onAlternar,
  tenue,
}: {
  titulo: string;
  nombres: string[];
  marcados: Set<string>;
  mesaDe: Record<string, string>;
  onAlternar: (n: string) => void;
  tenue?: boolean;
}) {
  if (!nombres.length) return null;
  return (
    <div className="mt-5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{titulo}</p>
      <ul className="mt-2 grid gap-1.5">
        {nombres.map((n) => {
          const llego = marcados.has(n);
          return (
            <li key={n}>
              <button
                onClick={() => onAlternar(n)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                  llego ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-white hover:bg-zinc-50"
                } ${tenue && !llego ? "text-zinc-500" : ""}`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-md border ${
                    llego ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-300 bg-white"
                  }`}
                >
                  {llego && <Check className="size-4" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-[0.95rem] font-medium">{n}</span>
                {mesaDe[n] ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-[0.8rem] font-medium text-[var(--acento)]">
                    <Armchair className="size-3.5" /> {mesaDe[n]}
                  </span>
                ) : (
                  <span className="shrink-0 text-[0.8rem] text-zinc-400">Sin mesa</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
