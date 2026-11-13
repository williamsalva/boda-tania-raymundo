"use client";

import { Armchair, Check, CircleCheck, OctagonAlert, ScanLine, SearchX, TriangleAlert, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { evaluar, faltanDe, porMesa, type Pase, type Tono } from "./tipos";

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

export function Ficha({
  pase: p,
  onRegistrar,
  onCerrar,
}: {
  pase: Pase;
  onRegistrar: (nombres: string[]) => void;
  onCerrar: () => void;
}) {
  const e = evaluar(p);
  const faltan = faltanDe(p);
  const [eligiendo, setEligiendo] = useState(false);
  const [marcados, setMarcados] = useState(() => new Set([...p.llegaron, ...p.esperados]));

  const principales = p.esperados.length ? p.esperados : p.invitados;
  const otros = p.invitados.filter((n) => !principales.includes(n));
  const cambio = marcados.size !== p.llegaron.length || [...marcados].some((n) => !p.llegaron.includes(n));

  function alternar(n: string) {
    setMarcados((m) => {
      const s = new Set(m);
      if (s.has(n)) s.delete(n);
      else s.add(n);
      return s;
    });
  }

  const subtitulo =
    p.asistencia === "si"
      ? `Confirmaron ${p.esperados.length} de ${p.invitados.length} invitados`
      : p.asistencia === "no"
        ? `${p.invitados.length} invitados · no asistirán`
        : `${p.invitados.length} invitados · sin respuesta`;

  return (
    <>
      <Banda {...e} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{p.nombre}</h2>
        <p className="mt-0.5 text-zinc-400">{subtitulo}</p>

        {!eligiendo ? (
          <div className="mt-4 grid gap-2">
            {porMesa(p, principales).map((g) => (
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
            {otros.length > 0 && (
              <p className="px-1 text-[0.8rem] text-zinc-500">No confirmaron: {otros.join(", ")}</p>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-[0.8rem] text-zinc-400">Toca a quienes sí llegaron.</p>
            <Lista nombres={principales} pase={p} marcados={marcados} onAlternar={alternar} />
            {otros.length > 0 && (
              <>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">No confirmaron</p>
                <Lista nombres={otros} pase={p} marcados={marcados} onAlternar={alternar} />
              </>
            )}
          </div>
        )}

        {p.mensaje && !eligiendo && <p className="mt-4 px-1 italic text-zinc-500">“{p.mensaje}”</p>}
      </div>

      <Pie>
        {eligiendo ? (
          <>
            <button
              disabled={!cambio}
              onClick={() => onRegistrar([...marcados])}
              className={`${btnPrincipal} bg-white text-zinc-900`}
            >
              <UserCheck className="size-5" />
              {marcados.size ? `Guardar · llegaron ${marcados.size}` : "Guardar · nadie ha llegado"}
            </button>
            <button onClick={() => setEligiendo(false)} className={btnSecundario}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            {faltan.length > 0 ? (
              <button
                onClick={() => onRegistrar([...p.llegaron, ...faltan])}
                className={`${btnPrincipal} ${e.tono === "ok" ? "bg-emerald-500 text-emerald-950" : "bg-amber-400 text-amber-950"}`}
              >
                <CircleCheck className="size-5" />
                {p.llegaron.length ? `Registrar a los ${faltan.length} que faltan` : `Registrar llegada · ${faltan.length}`}
              </button>
            ) : (
              <button onClick={onCerrar} className={`${btnPrincipal} bg-white text-zinc-900`}>
                <ScanLine className="size-5" /> Escanear siguiente
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setEligiendo(true)} className={btnSecundario}>
                {p.llegaron.length ? "Corregir" : "Solo algunos"}
              </button>
              <button onClick={onCerrar} className={btnSecundario}>
                Cerrar
              </button>
            </div>
          </>
        )}
      </Pie>
    </>
  );
}

function Lista({
  nombres,
  pase,
  marcados,
  onAlternar,
}: {
  nombres: string[];
  pase: Pase;
  marcados: Set<string>;
  onAlternar: (n: string) => void;
}) {
  return (
    <ul className="mt-2 grid gap-1.5">
      {nombres.map((n) => {
        const si = marcados.has(n);
        return (
          <li key={n}>
            <button
              onClick={() => onAlternar(n)}
              aria-pressed={si}
              className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl px-3.5 text-left ring-1 transition-colors ${
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
