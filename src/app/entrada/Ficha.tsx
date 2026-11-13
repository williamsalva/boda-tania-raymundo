"use client";

import { Armchair, Check, CircleCheck, Minus, OctagonAlert, Plus, ScanLine, SearchX, TriangleAlert, UserCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { cupoDe, evaluar, faltanDe, porMesa, quedanDe, type Pase, type Tono } from "./tipos";

const ESTILO_TONO: Record<Tono, { caja: string; icono: typeof CircleCheck }> = {
  ok: { caja: "bg-emerald-500 text-emerald-950", icono: CircleCheck },
  aviso: { caja: "bg-amber-400 text-amber-950", icono: TriangleAlert },
  alto: { caja: "bg-rose-600 text-white", icono: OctagonAlert },
};

/** Hoja que sube desde abajo, encima de la cámara. */
export function Hoja({ children, onCerrar }: { children: React.ReactNode; onCerrar: () => void }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 cursor-default bg-black/60 [animation:aparecer_.15s_ease]" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[92svh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-zinc-900 shadow-2xl ring-1 ring-white/10 [animation:hoja_.22s_cubic-bezier(.2,.8,.2,1)]"
      >
        {children}
      </div>
    </div>
  );
}

function Banda({ tono, titulo, detalle }: { tono: Tono; titulo: string; detalle: string }) {
  const { caja, icono: Icono } = ESTILO_TONO[tono];
  return (
    <div className={`flex items-start gap-3 px-5 pb-4 pt-5 ${caja}`}>
      <Icono className="mt-0.5 size-7 shrink-0" strokeWidth={2.2} />
      <div className="min-w-0">
        <p className="text-xl font-semibold leading-tight">{titulo}</p>
        <p className="mt-0.5 opacity-85">{detalle}</p>
      </div>
    </div>
  );
}

/** Botonera fija al pie de la hoja, al alcance del pulgar. */
function Pie({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-t border-white/10 bg-zinc-900 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      {children}
    </div>
  );
}

const btnPrincipal =
  "flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl text-[1.05rem] font-semibold transition-transform active:scale-[0.98] disabled:opacity-50";
const btnSecundario =
  "flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white/[0.07] font-medium text-zinc-200 active:bg-white/15";

type Modo = "ver" | "algunos" | "corregir";

export function Ficha({
  pase: p,
  onRegistrar,
  onCorregir,
  onCerrar,
}: {
  pase: Pase;
  /** Suma llegadas al pase. */
  onRegistrar: (nombres: string[]) => void;
  /** Reemplaza la lista de quienes están dentro (para errores). */
  onCorregir: (nombres: string[]) => void;
  onCerrar: () => void;
}) {
  const e = evaluar(p);
  const cupo = cupoDe(p);
  const quedan = quedanDe(p);
  const faltan = faltanDe(p);
  const [modo, setModo] = useState<Modo>("ver");

  // Esperados, más quien haya entrado en su lugar.
  const principales = p.invitados.filter((n) => p.esperados.includes(n) || p.llegaron.includes(n));
  const lista = principales.length ? principales : p.invitados;
  const otros = p.invitados.filter((n) => !lista.includes(n));

  const subtitulo =
    p.asistencia === "si"
      ? `Confirmaron ${p.esperados.length} de ${p.invitados.length} invitados`
      : p.asistencia === "no"
        ? `${p.invitados.length} invitados · no asistirán`
        : `${p.invitados.length} invitados · sin respuesta`;

  return (
    <>
      <Banda {...e} />
      {modo === "algunos" ? (
        <ElegirAlgunos pase={p} pendientes={p.esperados.filter((n) => !p.llegaron.includes(n))} quedan={quedan} onRegistrar={onRegistrar} onCancelar={() => setModo("ver")} />
      ) : modo === "corregir" ? (
        <Corregir pase={p} cupo={cupo} onGuardar={onCorregir} onCancelar={() => setModo("ver")} />
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-tight text-white">{p.nombre}</h2>
                <p className="mt-0.5 text-zinc-400">{subtitulo}</p>
              </div>
              {cupo > 0 && <Cupo dentro={p.llegaron.length} cupo={cupo} />}
            </div>

            <div className="mt-4 grid gap-2">
              {porMesa(p, lista).map((g) => (
                <div key={g.mesa || "sin"} className="flex gap-3 rounded-2xl bg-white/[0.05] p-3 ring-1 ring-white/[0.06]">
                  <div
                    className={`grid min-w-[4.5rem] place-items-center rounded-xl px-2 py-2 text-center ${
                      g.mesa ? "bg-rose-500/15 text-rose-200" : "bg-white/5 text-zinc-500"
                    }`}
                  >
                    <Armchair className="size-4 opacity-70" />
                    <span className="mt-0.5 text-[0.95rem] font-semibold leading-tight">{g.mesa || "Sin mesa"}</span>
                  </div>
                  <ul className="min-w-0 flex-1 self-center">
                    {g.nombres.map((n) => {
                      const llego = p.llegaron.includes(n);
                      return (
                        <li key={n} className={`flex items-center gap-1.5 py-0.5 text-[0.95rem] ${llego ? "text-emerald-300" : "text-zinc-100"}`}>
                          {llego && <Check className="size-4 shrink-0" />}
                          <span className="truncate">{n}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {otros.length > 0 && <p className="px-1 text-[0.8rem] text-zinc-500">No confirmaron: {otros.join(", ")}</p>}
            </div>

            {p.mensaje && <p className="mt-4 px-1 italic text-zinc-500">“{p.mensaje}”</p>}
          </div>

          <Pie>
            {quedan > 0 ? (
              <button
                onClick={() => onRegistrar(faltan)}
                className={`${btnPrincipal} ${e.tono === "ok" ? "bg-emerald-500 text-emerald-950" : "bg-amber-400 text-amber-950"}`}
              >
                <CircleCheck className="size-5" />
                {p.llegaron.length
                  ? quedan === 1
                    ? "Registrar al que falta"
                    : `Registrar a los ${quedan} que faltan`
                  : `Registrar llegada · ${quedan}`}
              </button>
            ) : (
              <button onClick={onCerrar} className={`${btnPrincipal} bg-white text-zinc-900`}>
                <ScanLine className="size-5" /> Escanear siguiente
              </button>
            )}
            <div className={`grid gap-2 ${quedan > 1 || p.llegaron.length ? "grid-cols-2" : ""}`}>
              {quedan > 1 && (
                <button onClick={() => setModo("algunos")} className={btnSecundario}>
                  <Users className="size-4" /> Solo algunos
                </button>
              )}
              {quedan <= 1 && p.llegaron.length > 0 && (
                <button onClick={() => setModo("corregir")} className={btnSecundario}>
                  Corregir
                </button>
              )}
              <button onClick={onCerrar} className={btnSecundario}>
                Cerrar
              </button>
            </div>
            {quedan > 1 && p.llegaron.length > 0 && (
              <button onClick={() => setModo("corregir")} className="py-1 text-center text-[0.8rem] font-medium text-zinc-500 underline-offset-4 hover:underline">
                Corregir quiénes entraron
              </button>
            )}
          </Pie>
        </>
      )}
    </>
  );
}

/** Indicador de lugares del pase: dentro / total. */
function Cupo({ dentro, cupo }: { dentro: number; cupo: number }) {
  return (
    <div className="shrink-0 text-right">
      <p className="num text-2xl font-semibold leading-none text-white">
        {dentro}
        <span className="text-zinc-500">/{cupo}</span>
      </p>
      <div className="mt-1.5 flex justify-end gap-0.5">
        {Array.from({ length: Math.min(cupo, 12) }, (_, i) => (
          <span key={i} className={`h-1.5 w-2.5 rounded-full ${i < dentro ? "bg-emerald-400" : "bg-white/15"}`} />
        ))}
      </div>
    </div>
  );
}

/**
 * Entra solo una parte del pase (p. ej. 3 de 5). El contador y los nombres son la misma selección:
 * − / + quitan o agregan al siguiente de la lista, y tocar un nombre lo alterna.
 * Los lugares que no se usen quedan disponibles para otra entrada con el mismo pase.
 */
function ElegirAlgunos({
  pase: p,
  pendientes,
  quedan,
  onRegistrar,
  onCancelar,
}: {
  pase: Pase;
  pendientes: string[];
  quedan: number;
  onRegistrar: (nombres: string[]) => void;
  onCancelar: () => void;
}) {
  const [elegidos, setElegidos] = useState<string[]>(() => pendientes.slice(0, quedan));
  const k = elegidos.length;
  const ordenar = (l: string[]) => pendientes.filter((n) => l.includes(n));

  const menos = () => setElegidos((l) => l.slice(0, -1));
  const mas = () =>
    setElegidos((l) => {
      const siguiente = pendientes.find((n) => !l.includes(n));
      return siguiente && l.length < quedan ? ordenar([...l, siguiente]) : l;
    });
  const alternar = (n: string) =>
    setElegidos((l) => (l.includes(n) ? l.filter((x) => x !== n) : l.length < quedan ? ordenar([...l, n]) : l));

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
        <h2 className="text-xl font-semibold text-white">{p.nombre}</h2>
        <p className="mt-0.5 text-zinc-400">¿Cuántos entran ahora?</p>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/[0.05] p-3 ring-1 ring-white/[0.06]">
          <button onClick={menos} disabled={k === 0} aria-label="Uno menos" className="grid size-14 cursor-pointer place-items-center rounded-2xl bg-white/10 text-white active:bg-white/20 disabled:opacity-30">
            <Minus className="size-6" />
          </button>
          <p className="text-center">
            <span className="num text-5xl font-semibold text-white">{k}</span>
            <span className="num block text-[0.8rem] text-zinc-400">de {quedan} {quedan === 1 ? "lugar" : "lugares"}</span>
          </p>
          <button onClick={mas} disabled={k >= quedan} aria-label="Uno más" className="grid size-14 cursor-pointer place-items-center rounded-2xl bg-white/10 text-white active:bg-white/20 disabled:opacity-30">
            <Plus className="size-6" />
          </button>
        </div>

        <p className="mt-5 text-xs font-medium uppercase tracking-wide text-zinc-500">¿Quiénes? Toca para cambiar</p>
        <Casillas nombres={pendientes} pase={p} marcados={new Set(elegidos)} onAlternar={alternar} lleno={k >= quedan} />
      </div>
      <Pie>
        <button disabled={k === 0} onClick={() => onRegistrar(elegidos)} className={`${btnPrincipal} bg-emerald-500 text-emerald-950`}>
          <UserCheck className="size-5" />
          {k === 0 ? "Elige quiénes entran" : `Registrar ${k} de ${quedan}`}
        </button>
        {k > 0 && k < quedan && (
          <p className="text-center text-[0.8rem] text-zinc-400">
            {quedan - k === 1 ? "El otro lugar queda" : `Los otros ${quedan - k} lugares quedan`} disponible{quedan - k === 1 ? "" : "s"} con este mismo pase.
          </p>
        )}
        <button onClick={onCancelar} className={btnSecundario}>
          Cancelar
        </button>
      </Pie>
    </>
  );
}

/** Para errores: cambiar quiénes están dentro, sin pasar del cupo del pase. */
function Corregir({
  pase: p,
  cupo,
  onGuardar,
  onCancelar,
}: {
  pase: Pase;
  cupo: number;
  onGuardar: (nombres: string[]) => void;
  onCancelar: () => void;
}) {
  const [marcados, setMarcados] = useState(() => new Set(p.llegaron));
  const lleno = marcados.size >= cupo;
  const cambio = marcados.size !== p.llegaron.length || [...marcados].some((n) => !p.llegaron.includes(n));
  const principales = p.esperados.length ? p.esperados : p.invitados;
  const otros = p.invitados.filter((n) => !principales.includes(n));

  function alternar(n: string) {
    setMarcados((m) => {
      const s = new Set(m);
      if (s.has(n)) s.delete(n);
      else if (s.size < cupo) s.add(n);
      return s;
    });
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-white">{p.nombre}</h2>
            <p className="mt-0.5 text-zinc-400">Marca a quienes sí están dentro.</p>
          </div>
          <Cupo dentro={marcados.size} cupo={cupo} />
        </div>
        <Casillas nombres={principales} pase={p} marcados={marcados} onAlternar={alternar} lleno={lleno} />
        {otros.length > 0 && (
          <>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">No confirmaron</p>
            <Casillas nombres={otros} pase={p} marcados={marcados} onAlternar={alternar} lleno={lleno} />
          </>
        )}
        {lleno && <p className="mt-3 text-center text-[0.8rem] text-zinc-400">El pase está lleno: desmarca a alguien para cambiarlo.</p>}
      </div>
      <Pie>
        <button disabled={!cambio} onClick={() => onGuardar([...marcados])} className={`${btnPrincipal} bg-white text-zinc-900`}>
          Guardar corrección · {marcados.size} de {cupo}
        </button>
        <button onClick={onCancelar} className={btnSecundario}>
          Cancelar
        </button>
      </Pie>
    </>
  );
}

function Casillas({
  nombres,
  pase,
  marcados,
  onAlternar,
  lleno,
}: {
  nombres: string[];
  pase: Pase;
  marcados: Set<string>;
  onAlternar: (n: string) => void;
  lleno: boolean;
}) {
  return (
    <ul className="mt-2 grid gap-1.5">
      {nombres.map((n) => {
        const si = marcados.has(n);
        const bloqueado = !si && lleno;
        return (
          <li key={n}>
            <button
              onClick={() => onAlternar(n)}
              aria-pressed={si}
              disabled={bloqueado}
              className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl px-3.5 text-left ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                si ? "bg-emerald-500/15 ring-emerald-400/40" : "bg-white/[0.04] ring-white/10"
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-lg border-2 ${
                  si ? "border-emerald-400 bg-emerald-400 text-emerald-950" : "border-zinc-600"
                }`}
              >
                {si && <Check className="size-4" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1 truncate text-[0.95rem] font-medium text-zinc-100">{n}</span>
              <span className="shrink-0 text-[0.8rem] text-zinc-400">{pase.mesaDe[n] || "Sin mesa"}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function PaseNoValido({ onBuscar, onCerrar }: { onBuscar: () => void; onCerrar: () => void }) {
  return (
    <>
      <Banda tono="alto" titulo="Pase no válido" detalle="Este código no corresponde a ninguna invitación." />
      <div className="flex items-center gap-3 px-5 py-5 text-zinc-400">
        <SearchX className="size-6 shrink-0" />
        <p>Puede ser un pase viejo o de otro evento. Busca a la familia por nombre.</p>
      </div>
      <Pie>
        <button onClick={onBuscar} className={`${btnPrincipal} bg-white text-zinc-900`}>
          Buscar por nombre
        </button>
        <button onClick={onCerrar} className={btnSecundario}>
          Escanear otro
        </button>
      </Pie>
    </>
  );
}
