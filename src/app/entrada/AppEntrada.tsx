"use client";

import { Check, LogOut, OctagonAlert, ScanLine, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { guardarLlegada, salirEntrada } from "./acciones";
import { Escaner } from "./Escaner";
import { Ficha, Hoja, PaseNoValido } from "./Ficha";
import { ListaInvitados } from "./ListaInvitados";
import { prepararSonido, senal } from "./senal";
import { evaluar, faltanDe, hora, personas, type Pase } from "./tipos";

type Vista = "escanear" | "invitados";
type Toast = { id: number; tono: "ok" | "error"; texto: string; accion?: { etiqueta: string; fn: () => void } };

/** Cada cuánto traer llegadas registradas desde otros teléfonos. */
const REFRESCO_MS = 20_000;

export function AppEntrada({
  pases: delServidor,
  inicial = null,
  puedeSalir,
}: {
  pases: Pase[];
  /** Código abierto al entrar desde un enlace /entrada/<codigo> (p. ej. escaneado con la cámara del teléfono). */
  inicial?: string | null;
  puedeSalir: boolean;
}) {
  const router = useRouter();
  // Copia local para mostrar los registros al instante; se reemplaza cuando llegan datos nuevos del servidor.
  const [pases, setPases] = useState(delServidor);
  const [base, setBase] = useState(delServidor);
  if (base !== delServidor) {
    setBase(delServidor);
    setPases(delServidor);
  }

  const [vista, setVista] = useState<Vista>("escanear");
  const [enfocarBusqueda, setEnfocarBusqueda] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(inicial);
  const [toast, setToast] = useState<Toast | null>(null);

  const porCodigo = useMemo(() => new Map(pases.map((p) => [p.codigo, p])), [pases]);
  const pase = abierto ? porCodigo.get(abierto) : undefined;

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESCO_MS);
    return () => clearInterval(t);
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.tono === "error" ? 9000 : 6000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    window.addEventListener("pointerdown", prepararSonido);
    return () => window.removeEventListener("pointerdown", prepararSonido);
  }, []);

  const alEscanear = useCallback(
    (codigo: string) => {
      const p = porCodigo.get(codigo);
      senal(p ? evaluar(p).tono : "alto");
      setToast(null);
      setAbierto(codigo);
    },
    [porCodigo],
  );

  const cerrar = useCallback(() => {
    setAbierto(null);
    if (window.location.pathname !== "/entrada") window.history.replaceState(null, "", "/entrada");
  }, []);

  function abrirDesdeLista(codigo: string) {
    setAbierto(codigo);
  }

  function irABuscar() {
    cerrar();
    setEnfocarBusqueda(true);
    setVista("invitados");
  }

  function aplicar(id: string, llegaron: string[], llegadaAt: string | null) {
    setPases((ps) => ps.map((p) => (p.id === id ? { ...p, llegaron, llegadaAt } : p)));
  }

  async function registrar(p: Pase, nombres: string[]) {
    const antes = { llegaron: p.llegaron, llegadaAt: p.llegadaAt };
    const llegaron = p.invitados.filter((n) => nombres.includes(n));
    const nuevos = llegaron.filter((n) => !antes.llegaron.includes(n)).length;

    // Optimista: cerramos y la cámara queda lista para el siguiente pase mientras se guarda.
    aplicar(p.id, llegaron, llegaron.length ? (p.llegadaAt ?? new Date().toISOString()) : null);
    cerrar();
    if (nuevos) navigator.vibrate?.(40);

    const r = await guardarLlegada(p.id, llegaron);
    if (!r?.ok) {
      aplicar(p.id, antes.llegaron, antes.llegadaAt);
      senal("alto");
      setToast({
        id: Date.now(),
        tono: "error",
        texto: `No se guardó ${p.nombre}. Revisa la señal.`,
        accion: { etiqueta: "Reintentar", fn: () => registrar(p, nombres) },
      });
      return;
    }
    setToast({
      id: Date.now(),
      tono: "ok",
      texto: nuevos
        ? `${p.nombre} · ${nuevos === 1 ? "1 llegada" : `${nuevos} llegadas`}`
        : `${p.nombre} · ${llegaron.length ? `${personas(llegaron.length)} dentro` : "sin llegadas"}`,
      accion: { etiqueta: "Deshacer", fn: () => deshacer(p, antes) },
    });
  }

  async function deshacer(p: Pase, antes: { llegaron: string[]; llegadaAt: string | null }) {
    setToast(null);
    aplicar(p.id, antes.llegaron, antes.llegadaAt);
    const r = await guardarLlegada(p.id, antes.llegaron);
    setToast(
      r?.ok
        ? { id: Date.now(), tono: "ok", texto: `Se deshizo el registro de ${p.nombre}` }
        : { id: Date.now(), tono: "error", texto: "No se pudo deshacer. Corrígelo desde la ficha." },
    );
  }

  // Resumen de la noche
  const confirmadas = pases.filter((p) => p.asistencia === "si");
  const esperados = confirmadas.reduce((s, p) => s + p.esperados.length, 0);
  const llegaron = pases.reduce((s, p) => s + p.llegaron.length, 0);
  const porLlegar = confirmadas.filter((p) => faltanDe(p).length > 0).length;
  const avance = esperados ? Math.min(100, Math.round((llegaron / esperados) * 100)) : 0;
  const recientes = pases
    .filter((p) => p.llegadaAt && p.llegaron.length)
    .sort((a, b) => b.llegadaAt!.localeCompare(a.llegadaAt!))
    .slice(0, 5);

  return (
    <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <header className="pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-rose-300/80">Tania & Raymundo</p>
            <h1 className="text-lg font-semibold text-white">Entrada</h1>
          </div>
          {puedeSalir && (
            <form action={salirEntrada}>
              <button aria-label="Salir" className="grid size-10 cursor-pointer place-items-center rounded-full text-zinc-400 hover:bg-white/10">
                <LogOut className="size-4" />
              </button>
            </form>
          )}
        </div>

        <div className="mt-3 rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/[0.06]">
          <div className="flex items-end justify-between gap-3">
            <p className="text-zinc-400">
              <span className="num text-3xl font-semibold text-white">{llegaron}</span>
              <span className="num"> / {esperados}</span> personas
            </p>
            <p className="text-right text-[0.8rem] text-zinc-400">
              {porLlegar ? `${porLlegar} ${porLlegar === 1 ? "familia" : "familias"} por llegar` : "Ya llegaron todos"}
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-emerald-400 transition-[width] duration-500" style={{ width: `${avance}%` }} />
          </div>
        </div>
      </header>

      <main className="mt-4">
        {vista === "escanear" ? (
          <>
            <Escaner pausado={abierto !== null} onCodigo={alEscanear} />
            <button
              onClick={irABuscar}
              className="mt-3 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white/[0.07] font-medium text-zinc-200 active:bg-white/15"
            >
              <Search className="size-4" /> ¿Sin QR? Buscar por nombre
            </button>

            {recientes.length > 0 && (
              <section className="mt-6">
                <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Últimas llegadas</h2>
                <ul className="mt-2 divide-y divide-white/[0.06] overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
                  {recientes.map((p) => (
                    <li key={p.id}>
                      <button onClick={() => abrirDesdeLista(p.codigo)} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left active:bg-white/[0.06]">
                        <span className="num w-[4.5rem] shrink-0 whitespace-nowrap text-[0.8rem] text-zinc-500">{hora(p.llegadaAt!)}</span>
                        <span className="min-w-0 flex-1 truncate text-zinc-100">{p.nombre}</span>
                        <span className="num shrink-0 text-[0.8rem] text-emerald-300">
                          {p.llegaron.length}/{p.esperados.length || p.invitados.length}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <ListaInvitados pases={pases} onAbrir={abrirDesdeLista} enfocar={enfocarBusqueda} />
        )}
      </main>

      {toast && (
        <div
          key={toast.id}
          role="status"
          className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center gap-3 rounded-2xl bg-zinc-800 py-2 pl-4 pr-2 text-zinc-100 shadow-2xl ring-1 ring-white/10 [animation:subir_.18s_ease]"
        >
          {toast.tono === "ok" ? (
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-400 text-emerald-950">
              <Check className="size-4" strokeWidth={3} />
            </span>
          ) : (
            <OctagonAlert className="size-5 shrink-0 text-rose-400" />
          )}
          <p className="min-w-0 flex-1 py-1.5 leading-snug">{toast.texto}</p>
          {toast.accion && (
            <button onClick={toast.accion.fn} className="h-10 shrink-0 cursor-pointer rounded-xl px-3 font-semibold text-rose-300 active:bg-white/10">
              {toast.accion.etiqueta}
            </button>
          )}
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-2">
          <BotonVista activo={vista === "escanear"} onClick={() => setVista("escanear")} icono={ScanLine} nombre="Escanear" />
          <BotonVista
            activo={vista === "invitados"}
            onClick={() => {
              setEnfocarBusqueda(false);
              setVista("invitados");
            }}
            icono={Users}
            nombre="Invitados"
            insignia={porLlegar}
          />
        </div>
      </nav>

      {abierto && (
        <Hoja onCerrar={cerrar}>
          {pase ? (
            <Ficha key={pase.id} pase={pase} onRegistrar={(n) => registrar(pase, n)} onCerrar={cerrar} />
          ) : (
            <PaseNoValido onBuscar={irABuscar} onCerrar={cerrar} />
          )}
        </Hoja>
      )}
    </div>
  );
}

function BotonVista({
  activo,
  onClick,
  icono: Icono,
  nombre,
  insignia,
}: {
  activo: boolean;
  onClick: () => void;
  icono: typeof ScanLine;
  nombre: string;
  insignia?: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={activo ? "page" : undefined}
      className={`flex h-16 cursor-pointer flex-col items-center justify-center gap-1 text-[0.75rem] font-medium ${activo ? "text-white" : "text-zinc-500"}`}
    >
      <span className="relative">
        <Icono className="size-6" strokeWidth={activo ? 2.2 : 1.8} />
        {insignia ? (
          <span className="num absolute -right-3.5 -top-1.5 min-w-5 rounded-full bg-rose-500 px-1 text-center text-[0.65rem] leading-5 text-white">
            {insignia}
          </span>
        ) : null}
      </span>
      {nombre}
    </button>
  );
}
