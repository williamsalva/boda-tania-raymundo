"use client";

import { Check, LogOut, OctagonAlert, ScanLine, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { guardarLlegada, salirEntrada } from "./acciones";
import { Escaner } from "./Escaner";
import { Ficha, Hoja, PaseNoValido } from "./Ficha";
import { ListaInvitados } from "./ListaInvitados";
import { prepararSonido, senal } from "./senal";
import { evaluar, faltanDe, hora, lugares, type Pase } from "./tipos";

type Vista = "escanear" | "invitados";
type Cambio = { agregar?: string[]; quitar?: string[] };
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

  /** Aplica un cambio sobre lo que hay en pantalla (optimista). */
  function aplicar(id: string, { agregar = [], quitar = [] }: Cambio) {
    setPases((ps) =>
      ps.map((p) => {
        if (p.id !== id) return p;
        const dentro = new Set(p.llegaron);
        agregar.forEach((n) => dentro.add(n));
        quitar.forEach((n) => dentro.delete(n));
        const llegaron = p.invitados.filter((n) => dentro.has(n));
        return { ...p, llegaron, llegadaAt: llegaron.length ? (p.llegadaAt ?? new Date().toISOString()) : null };
      }),
    );
  }

  function fijar(id: string, llegaron: string[], llegadaAt: string | null) {
    setPases((ps) => ps.map((p) => (p.id === id ? { ...p, llegaron, llegadaAt } : p)));
  }

  /**
   * Guarda un cambio de llegadas: cierra la hoja al instante (la cámara queda lista para el siguiente)
   * y el servidor lo suma a lo que ya estaba, sin pasar del cupo del pase.
   */
  async function guardar(p: Pase, cambio: Cambio, deshaciendo = false) {
    const agregar = (cambio.agregar ?? []).filter((n) => !p.llegaron.includes(n));
    const quitar = (cambio.quitar ?? []).filter((n) => p.llegaron.includes(n));
    if (!agregar.length && !quitar.length) return cerrar();

    aplicar(p.id, { agregar, quitar });
    cerrar();
    if (agregar.length) navigator.vibrate?.(40);

    const r = await guardarLlegada(p.id, { agregar, quitar });
    if (!r.ok) {
      aplicar(p.id, { agregar: quitar, quitar: agregar });
      senal("alto");
      const sinLugar = /pase/i.test(r.error);
      setToast({
        id: Date.now(),
        tono: "error",
        texto: sinLugar ? `${p.nombre}: ${r.error}` : `No se guardó ${p.nombre}. Revisa la señal.`,
        accion: sinLugar ? undefined : { etiqueta: "Reintentar", fn: () => guardar(p, cambio, deshaciendo) },
      });
      return;
    }
    fijar(p.id, r.llegaron, r.llegadaAt);

    const quedan = Math.max(0, p.esperados.length - r.llegaron.length);
    const texto = deshaciendo
      ? `Se deshizo el registro de ${p.nombre}`
      : agregar.length && !quitar.length
        ? `${p.nombre} · ${agregar.length === 1 ? "entró 1" : `entraron ${agregar.length}`} · ${quedan ? `${quedan === 1 ? "queda" : "quedan"} ${lugares(quedan)}` : "pase completo"}`
        : `${p.nombre} · corregido: ${r.llegaron.length} de ${p.esperados.length} dentro`;
    const actualizado = { ...p, llegaron: r.llegaron, llegadaAt: r.llegadaAt };
    setToast({
      id: Date.now(),
      tono: "ok",
      texto,
      accion: deshaciendo ? undefined : { etiqueta: "Deshacer", fn: () => guardar(actualizado, { agregar: quitar, quitar: agregar }, true) },
    });
  }

  const registrar = (p: Pase, nombres: string[]) => guardar(p, { agregar: nombres });
  const corregir = (p: Pase, nombres: string[]) =>
    guardar(p, { agregar: nombres, quitar: p.llegaron.filter((n) => !nombres.includes(n)) });

  // Resumen de la noche
  const confirmadas = pases.filter((p) => p.asistencia === "si");
  // Confirmados, más el cupo de familias sin confirmar a las que sí se dejó pasar.
  const esperados = pases
    .filter((p) => p.asistencia === "si" || p.llegaron.length > 0)
    .reduce((s, p) => s + Math.max(p.esperados.length, p.llegaron.length), 0);
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
            <Ficha key={pase.id} pase={pase} onRegistrar={(n) => registrar(pase, n)} onCorregir={(n) => corregir(pase, n)} onCerrar={cerrar} />
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
