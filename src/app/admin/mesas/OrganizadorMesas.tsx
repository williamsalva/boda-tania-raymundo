"use client";

import {
  AlertTriangle,
  Check,
  GripVertical,
  Minus,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Familia } from "@/lib/familias";
import type { Asiento, Mesa, Persona } from "@/lib/mesas";
import { agregarMesas, borrarMesa, editarMesa, mover, type ResultadoMesa } from "./acciones";

type FamiliaMesa = Pick<Familia, "id" | "nombre" | "invitados" | "asistencia" | "asistentes">;
type Estado = "si" | "pendiente" | "no";
type Invitado = Persona & { clave: string; familia: string; estado: Estado };
type Filtro = "todos" | "si" | "pendiente";

const clave = (p: Persona) => `${p.familia_id}::${p.invitado}`;

const AVATARES = [
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-fuchsia-100 text-fuchsia-700",
];

function colorFamilia(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATARES[h % AVATARES.length];
}

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");

const sinAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const COLOR_ESTADO: Record<Estado, string> = {
  si: "fill-emerald-500",
  pendiente: "fill-amber-400",
  no: "fill-rose-400",
};

// ——— Mesa redonda con sus sillas ———

function MesaRedonda({ ocupados, capacidad }: { ocupados: Estado[]; capacidad: number }) {
  const R = 54;
  const silla = Math.max(4, Math.min(8, 150 / capacidad)).toFixed(2);
  const lleno = ocupados.length >= capacidad;
  return (
    <svg viewBox="0 0 140 140" className="size-32 shrink-0">
      <circle cx="70" cy="70" r="36" className="fill-zinc-50 stroke-zinc-200" strokeWidth="1.5" />
      {Array.from({ length: capacidad }, (_, i) => {
        const a = (i / capacidad) * Math.PI * 2 - Math.PI / 2;
        const estado = ocupados[i];
        return (
          <circle
            key={i}
            // Redondeo: servidor y navegador difieren en el último decimal de cos/sin.
            cx={(70 + R * Math.cos(a)).toFixed(2)}
            cy={(70 + R * Math.sin(a)).toFixed(2)}
            r={silla}
            className={estado ? COLOR_ESTADO[estado] : "fill-white stroke-zinc-300"}
            strokeWidth="1.2"
          />
        );
      })}
      <text x="70" y="68" textAnchor="middle" className={`num text-[20px] font-semibold ${lleno ? "fill-emerald-600" : "fill-zinc-900"}`}>
        {ocupados.length}
      </text>
      <text x="70" y="84" textAnchor="middle" className="fill-zinc-400 text-[10px]">
        de {capacidad}
      </text>
    </svg>
  );
}

// ——— Tarjeta de mesa ———

function TarjetaMesa({
  mesa,
  sentados,
  seleccionados,
  arrastrando,
  onSoltar,
  onSentarSeleccion,
  onLevantar,
  onRenombrar,
  onCapacidad,
  onEliminar,
  onArrastrar,
}: {
  mesa: Mesa;
  sentados: Invitado[];
  seleccionados: number;
  arrastrando: boolean;
  onSoltar: (e: React.DragEvent) => void;
  onSentarSeleccion: () => void;
  onLevantar: (p: Invitado) => void;
  onRenombrar: (nombre: string) => void;
  onCapacidad: (capacidad: number) => void;
  onEliminar: () => void;
  onArrastrar: (e: React.DragEvent, p: Invitado) => void;
}) {
  const [encima, setEncima] = useState(false);
  const [menu, setMenu] = useState(false);
  const libres = mesa.capacidad - sentados.length;
  const noVan = sentados.filter((p) => p.estado === "no").length;

  return (
    <article
      onDragOver={(e) => {
        e.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => {
        setEncima(false);
        onSoltar(e);
      }}
      className={`flex flex-col rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all ${
        encima ? "border-zinc-900 ring-4 ring-zinc-100" : arrastrando ? "border-dashed border-zinc-300" : "border-zinc-200"
      }`}
    >
      <header className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
        <input
          key={mesa.nombre}
          defaultValue={mesa.nombre}
          onBlur={(e) => e.target.value.trim() !== mesa.nombre && onRenombrar(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          maxLength={40}
          aria-label="Nombre de la mesa"
          className="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 font-semibold text-zinc-900 outline-none hover:bg-zinc-50 focus:bg-zinc-50 focus:ring-2 focus:ring-zinc-200"
        />
        <div className="flex items-center rounded-lg border border-zinc-200" title="Lugares en la mesa">
          <button
            onClick={() => onCapacidad(mesa.capacidad - 1)}
            disabled={mesa.capacidad <= Math.max(1, sentados.length)}
            aria-label="Quitar un lugar"
            className="grid size-7 cursor-pointer place-items-center text-zinc-500 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="num w-6 text-center text-[0.8rem] font-medium">{mesa.capacidad}</span>
          <button
            onClick={() => onCapacidad(mesa.capacidad + 1)}
            disabled={mesa.capacidad >= 50}
            aria-label="Agregar un lugar"
            className="grid size-7 cursor-pointer place-items-center text-zinc-500 hover:text-zinc-900 disabled:opacity-30"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenu((m) => !m)}
            onBlur={() => setTimeout(() => setMenu(false), 150)}
            aria-label="Más acciones"
            className="grid size-7 cursor-pointer place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100"
          >
            <MoreHorizontal className="size-4" />
          </button>
          {menu && (
            <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
              <button
                onMouseDown={onEliminar}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="size-4" /> Eliminar mesa
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex items-center gap-4 px-4 pt-4">
        <MesaRedonda ocupados={sentados.map((p) => p.estado)} capacidad={mesa.capacidad} />
        <div className="min-w-0 flex-1 space-y-1.5 text-[0.8rem]">
          <p className={libres > 0 ? "text-zinc-600" : libres === 0 ? "font-medium text-emerald-700" : "font-medium text-rose-600"}>
            {libres > 0 ? `${libres} ${libres === 1 ? "lugar libre" : "lugares libres"}` : libres === 0 ? "Mesa completa" : `${-libres} de más`}
          </p>
          {noVan > 0 && (
            <p className="flex items-center gap-1.5 text-rose-600">
              <AlertTriangle className="size-3.5" /> {noVan} {noVan === 1 ? "ya dijo" : "ya dijeron"} que no va
            </p>
          )}
          {seleccionados > 0 && (
            <button
              onClick={onSentarSeleccion}
              disabled={seleccionados > libres}
              className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1.5 font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              <UserPlus className="size-3.5" />
              {seleccionados > libres ? "No caben" : `Sentar aquí (${seleccionados})`}
            </button>
          )}
        </div>
      </div>

      <ul className="flex min-h-16 flex-1 flex-wrap content-start gap-1.5 px-4 pb-4 pt-3">
        {sentados.length === 0 && (
          <li className="w-full rounded-lg border border-dashed border-zinc-200 py-3 text-center text-[0.8rem] text-zinc-400">
            Arrastra invitados aquí
          </li>
        )}
        {sentados.map((p) => (
          <li
            key={p.clave}
            draggable
            onDragStart={(e) => onArrastrar(e, p)}
            title={`${p.invitado} · ${p.familia}`}
            className={`group inline-flex cursor-grab items-center gap-1.5 rounded-md border py-1 pl-1 pr-1.5 active:cursor-grabbing ${
              p.estado === "no" ? "border-rose-200 bg-rose-50 text-rose-700 line-through" : "border-zinc-200 bg-white text-zinc-700"
            }`}
          >
            <span className={`grid size-5 place-items-center rounded-full text-[0.6rem] font-semibold uppercase ${colorFamilia(p.familia_id)}`}>
              {iniciales(p.invitado)}
            </span>
            <span className="max-w-32 truncate">{p.invitado}</span>
            <button
              onClick={() => onLevantar(p)}
              aria-label={`Quitar a ${p.invitado} de la mesa`}
              className="grid size-4 cursor-pointer place-items-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X className="size-3" />
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}

// ——— Organizador ———

export function OrganizadorMesas({
  familias,
  mesas: mesasIniciales,
  asientos: asientosIniciales,
}: {
  familias: FamiliaMesa[];
  mesas: Mesa[];
  asientos: Asiento[];
}) {
  // Estado local para respuesta inmediata; se sincroniza cuando el servidor manda datos nuevos.
  const [mesas, setMesas] = useState(mesasIniciales);
  const [asientos, setAsientos] = useState(asientosIniciales);
  const [origen, setOrigen] = useState({ mesasIniciales, asientosIniciales });
  if (origen.mesasIniciales !== mesasIniciales || origen.asientosIniciales !== asientosIniciales) {
    setOrigen({ mesasIniciales, asientosIniciales });
    setMesas(mesasIniciales);
    setAsientos(asientosIniciales);
  }

  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [capacidadNueva, setCapacidadNueva] = useState(12);
  const [arrastrando, setArrastrando] = useState(false);
  const [porEliminar, setPorEliminar] = useState<Mesa | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null);
  const [ocupado, iniciar] = useTransition();
  const arrastre = useRef<Invitado[]>([]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2800);
    return () => clearTimeout(t);
  }, [aviso]);

  // Todas las personas con su estado de asistencia.
  const personas = useMemo(() => {
    const lista: Invitado[] = [];
    for (const f of familias) {
      for (const invitado of f.invitados) {
        const estado: Estado =
          f.asistencia === "pendiente" ? "pendiente" : f.asistentes?.includes(invitado) ? "si" : "no";
        const p = { familia_id: f.id, invitado };
        lista.push({ ...p, clave: clave(p), familia: f.nombre, estado });
      }
    }
    return lista;
  }, [familias]);
  const porClave = useMemo(() => new Map(personas.map((p) => [p.clave, p])), [personas]);

  const mesaDe = useMemo(() => new Map(asientos.map((a) => [clave(a), a.mesa_id])), [asientos]);
  const sentadosEn = (mesaId: string) =>
    asientos.filter((a) => a.mesa_id === mesaId).map((a) => porClave.get(clave(a))).filter((p): p is Invitado => Boolean(p));

  // Por sentar: sin mesa y que no hayan dicho que no.
  const porSentar = personas.filter((p) => !mesaDe.has(p.clave) && p.estado !== "no");
  const q = sinAcentos(busqueda.trim());
  const visibles = porSentar.filter(
    (p) =>
      (filtro === "todos" || p.estado === filtro) &&
      (!q || sinAcentos(p.invitado).includes(q) || sinAcentos(p.familia).includes(q)),
  );
  const grupos = useMemo(() => {
    const m = new Map<string, Invitado[]>();
    for (const p of visibles) m.set(p.familia_id, [...(m.get(p.familia_id) ?? []), p]);
    return [...m.values()].sort((a, b) => a[0].familia.localeCompare(b[0].familia, "es"));
  }, [visibles]);

  const lugares = mesas.reduce((s, m) => s + m.capacidad, 0);
  const sentados = personas.filter((p) => mesaDe.has(p.clave) && p.estado !== "no").length;
  const faltanLugares = Math.max(0, sentados + porSentar.length - lugares);

  function ejecutar(accion: () => Promise<ResultadoMesa>, revertir: () => void, exito?: string) {
    iniciar(async () => {
      const r = await accion();
      if (!r.ok) {
        revertir();
        setAviso({ texto: r.error, error: true });
      } else if (exito) {
        setAviso({ texto: exito });
      }
    });
  }

  function sentar(mesaId: string | null, lista: Invitado[]) {
    if (lista.length === 0) return;
    const mesa = mesas.find((m) => m.id === mesaId);
    if (mesa) {
      const yaAhi = lista.filter((p) => mesaDe.get(p.clave) === mesa.id).length;
      const libres = mesa.capacidad - sentadosEn(mesa.id).length + yaAhi;
      if (lista.length > libres) {
        setAviso({ texto: `En ${mesa.nombre} solo quedan ${Math.max(0, libres)} lugares.`, error: true });
        return;
      }
    }
    const antes = asientos;
    const moviendo = new Set(lista.map((p) => p.clave));
    const resto = asientos.filter((a) => !moviendo.has(clave(a)));
    setAsientos(mesaId ? [...resto, ...lista.map((p) => ({ familia_id: p.familia_id, invitado: p.invitado, mesa_id: mesaId }))] : resto);
    setSeleccion(new Set());
    const personasPlanas = lista.map(({ familia_id, invitado }) => ({ familia_id, invitado }));
    ejecutar(() => mover(mesaId, personasPlanas), () => setAsientos(antes));
  }

  function alternar(p: Invitado) {
    setSeleccion((s) => {
      const n = new Set(s);
      if (n.has(p.clave)) n.delete(p.clave);
      else n.add(p.clave);
      return n;
    });
  }

  function alternarFamilia(grupo: Invitado[]) {
    setSeleccion((s) => {
      const n = new Set(s);
      const todos = grupo.every((p) => n.has(p.clave));
      for (const p of grupo) {
        if (todos) n.delete(p.clave);
        else n.add(p.clave);
      }
      return n;
    });
  }

  function iniciarArrastre(e: React.DragEvent, p: Invitado) {
    // Si arrastras a alguien seleccionado, se mueve toda la selección.
    const lista = seleccion.has(p.clave) ? [...seleccion].map((c) => porClave.get(c)!).filter(Boolean) : [p];
    arrastre.current = lista;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", lista.map((x) => x.invitado).join(", "));
    setArrastrando(true);
  }

  function soltarEn(mesaId: string | null) {
    setArrastrando(false);
    sentar(mesaId, arrastre.current);
    arrastre.current = [];
  }

  function nuevasMesas(cuantas: number) {
    ejecutar(
      () => agregarMesas(cuantas, capacidadNueva),
      () => {},
      cuantas === 1 ? "Mesa agregada" : `${cuantas} mesas agregadas`,
    );
  }

  function cambiarMesa(mesa: Mesa, cambios: Partial<Pick<Mesa, "nombre" | "capacidad">>) {
    const antes = mesas;
    const nueva = { ...mesa, ...cambios, nombre: (cambios.nombre ?? mesa.nombre).trim() || mesa.nombre };
    setMesas((ms) => ms.map((m) => (m.id === mesa.id ? nueva : m)));
    ejecutar(() => editarMesa(mesa.id, nueva.nombre, nueva.capacidad), () => setMesas(antes));
  }

  function eliminar(mesa: Mesa) {
    const antes = { mesas, asientos };
    setMesas((ms) => ms.filter((m) => m.id !== mesa.id));
    setAsientos((as) => as.filter((a) => a.mesa_id !== mesa.id));
    setPorEliminar(null);
    ejecutar(
      () => borrarMesa(mesa.id),
      () => {
        setMesas(antes.mesas);
        setAsientos(antes.asientos);
      },
      `${mesa.nombre} eliminada`,
    );
  }

  const seleccionados = [...seleccion].map((c) => porClave.get(c)).filter((p): p is Invitado => Boolean(p));

  return (
    <div onDragEnd={() => setArrastrando(false)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Mesas</h1>
          <p className="mt-1 text-zinc-500">Arrastra a tus invitados a su mesa, o selecciónalos y elige dónde sentarlos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white py-1 pl-3 pr-1 text-[0.8rem] text-zinc-600">
            Lugares por mesa
            <input
              type="number"
              min={1}
              max={50}
              value={capacidadNueva}
              onChange={(e) => setCapacidadNueva(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
              className="num w-12 rounded-md bg-zinc-50 px-1.5 py-1 text-center text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </label>
          {faltanLugares > 0 && (
            <button
              onClick={() => nuevasMesas(Math.ceil(faltanLugares / capacidadNueva))}
              disabled={ocupado}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
              title={`Faltan ${faltanLugares} lugares para todos los invitados que no han dicho que no`}
            >
              <Sparkles className="size-4" /> Crear {Math.ceil(faltanLugares / capacidadNueva)} mesas que faltan
            </button>
          )}
          <button
            onClick={() => nuevasMesas(1)}
            disabled={ocupado}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
          >
            <Plus className="size-4" /> Agregar mesa
          </button>
        </div>
      </div>

      {/* Indicadores */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Mesas", mesas.length, `${lugares} lugares en total`],
          ["Sentados", sentados, `de ${sentados + porSentar.length} invitados`],
          ["Por sentar", porSentar.length, `${porSentar.filter((p) => p.estado === "si").length} ya confirmaron`],
          ["Lugares libres", Math.max(0, lugares - sentados), faltanLugares ? `Faltan ${faltanLugares} lugares` : "Alcanzan para todos"],
        ].map(([t, v, d]) => (
          <div key={t as string} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <p className="text-[0.8rem] font-medium text-zinc-500">{t}</p>
            <p className="num mt-1 text-2xl font-semibold">{v}</p>
            <p className={`text-xs ${String(d).startsWith("Faltan") ? "text-amber-600" : "text-zinc-500"}`}>{d}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[320px_1fr]">
        {/* Invitados sin mesa */}
        <aside
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => soltarEn(null)}
          className={`flex flex-col rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:sticky lg:top-6 lg:max-h-[calc(100svh-3rem)] ${
            arrastrando ? "border-dashed border-zinc-300" : "border-zinc-200"
          }`}
        >
          <div className="border-b border-zinc-100 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-zinc-900">Sin mesa</p>
              <span className="num rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{porSentar.length}</span>
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar invitado o familia"
                className="w-full rounded-lg border border-zinc-200 py-2 pl-8 pr-3 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              />
            </div>
            <div className="mt-2 flex rounded-lg bg-zinc-100 p-0.5">
              {(
                [
                  ["todos", "Todos"],
                  ["si", "Confirmados"],
                  ["pendiente", "Pendientes"],
                ] as const
              ).map(([valor, texto]) => (
                <button
                  key={valor}
                  onClick={() => setFiltro(valor)}
                  className={`flex-1 cursor-pointer rounded-md py-1.5 text-[0.8rem] font-medium ${
                    filtro === valor ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[50svh] flex-1 overflow-y-auto p-2 lg:max-h-none">
            {grupos.length === 0 ? (
              <p className="px-3 py-10 text-center text-zinc-500">
                {porSentar.length ? "Nadie coincide con la búsqueda." : "¡Todos tienen mesa! 🎉"}
              </p>
            ) : (
              grupos.map((grupo) => {
                const todos = grupo.every((p) => seleccion.has(p.clave));
                return (
                  <div key={grupo[0].familia_id} className="mb-1 rounded-lg p-1.5">
                    <div className="flex items-center gap-2 px-1.5 py-1">
                      <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.6rem] font-semibold uppercase ${colorFamilia(grupo[0].familia_id)}`}>
                        {iniciales(grupo[0].familia.replace(/^familia\s+/i, ""))}
                      </span>
                      <p className="min-w-0 flex-1 truncate text-[0.8rem] font-medium text-zinc-900">{grupo[0].familia}</p>
                      <button
                        onClick={() => alternarFamilia(grupo)}
                        className="cursor-pointer rounded-md px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        {todos ? "Quitar" : "Elegir todos"}
                      </button>
                    </div>
                    <ul className="mt-0.5 space-y-0.5">
                      {grupo.map((p) => {
                        const activo = seleccion.has(p.clave);
                        return (
                          <li key={p.clave}>
                            <button
                              draggable
                              onDragStart={(e) => iniciarArrastre(e, p)}
                              onClick={() => alternar(p)}
                              className={`group flex w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors ${
                                activo ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"
                              }`}
                            >
                              <GripVertical className={`size-3.5 shrink-0 ${activo ? "text-white/50" : "text-zinc-300 group-hover:text-zinc-400"}`} />
                              <span
                                className={`grid size-4 shrink-0 place-items-center rounded border ${
                                  activo ? "border-white bg-white text-zinc-900" : "border-zinc-300"
                                }`}
                              >
                                {activo && <Check className="size-3" />}
                              </span>
                              <span className="min-w-0 flex-1 truncate">{p.invitado}</span>
                              <span
                                className={`size-1.5 shrink-0 rounded-full ${p.estado === "si" ? "bg-emerald-500" : "bg-amber-400"}`}
                                title={p.estado === "si" ? "Confirmó" : "Pendiente"}
                              />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-4 border-t border-zinc-100 px-4 py-2.5 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> Confirmó</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" /> Pendiente</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-400" /> No va</span>
          </div>
        </aside>

        {/* Mesas */}
        {mesas.length === 0 ? (
          <div className="grid place-items-center rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center">
            <div>
              <p className="font-medium text-zinc-900">Aún no hay mesas</p>
              <p className="mt-1 text-zinc-500">
                Crea tu primera mesa de {capacidadNueva} lugares
                {porSentar.length > 0 && ` o genera las ${Math.ceil(porSentar.length / capacidadNueva)} que necesitas`}.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  onClick={() => nuevasMesas(1)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 font-medium text-white hover:bg-zinc-800"
                >
                  <Plus className="size-4" /> Agregar mesa
                </button>
                {porSentar.length > capacidadNueva && (
                  <button
                    onClick={() => nuevasMesas(Math.ceil(porSentar.length / capacidadNueva))}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 px-3.5 py-2 font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <Sparkles className="size-4" /> Crear {Math.ceil(porSentar.length / capacidadNueva)} mesas
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {mesas.map((mesa) => (
              <TarjetaMesa
                key={mesa.id}
                mesa={mesa}
                sentados={sentadosEn(mesa.id)}
                seleccionados={seleccionados.length}
                arrastrando={arrastrando}
                onSoltar={() => soltarEn(mesa.id)}
                onSentarSeleccion={() => sentar(mesa.id, seleccionados)}
                onLevantar={(p) => sentar(null, [p])}
                onRenombrar={(nombre) => cambiarMesa(mesa, { nombre })}
                onCapacidad={(capacidad) => cambiarMesa(mesa, { capacidad })}
                onEliminar={() => setPorEliminar(mesa)}
                onArrastrar={iniciarArrastre}
              />
            ))}
          </div>
        )}
      </div>

      {/* Barra de selección */}
      {seleccionados.length > 0 && (
        <div className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-white shadow-xl [animation:subir_.2s_ease]">
          <span className="num grid size-7 place-items-center rounded-full bg-white/15 text-sm font-semibold">{seleccionados.length}</span>
          <p className="flex-1">{seleccionados.length === 1 ? "invitado seleccionado" : "invitados seleccionados"} · elige una mesa</p>
          <button onClick={() => setSeleccion(new Set())} className="cursor-pointer rounded-md px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white">
            Limpiar
          </button>
        </div>
      )}

      {porEliminar && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-900/40 p-4 [animation:aparecer_.15s_ease]" onClick={() => setPorEliminar(null)}>
          <div role="alertdialog" aria-modal className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl [animation:subir_.2s_ease]" onClick={(e) => e.stopPropagation()}>
            <span className="grid size-10 place-items-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-zinc-900">¿Eliminar {porEliminar.nombre}?</h3>
            <p className="mt-1.5 text-zinc-500">
              {sentadosEn(porEliminar.id).length
                ? `Las ${sentadosEn(porEliminar.id).length} personas sentadas ahí volverán a "Sin mesa".`
                : "La mesa está vacía."}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setPorEliminar(null)} className="cursor-pointer rounded-lg border border-zinc-200 px-3.5 py-2 font-medium hover:bg-zinc-50">
                Cancelar
              </button>
              <button onClick={() => eliminar(porEliminar)} className="cursor-pointer rounded-lg bg-rose-600 px-3.5 py-2 font-medium text-white hover:bg-rose-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {aviso && (
        <div
          role="status"
          className={`fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg px-4 py-2.5 text-white shadow-lg [animation:subir_.2s_ease] sm:bottom-5 sm:left-auto sm:right-6 sm:translate-x-0 ${
            aviso.error ? "bg-rose-600" : "bg-zinc-900"
          }`}
        >
          {aviso.error ? <AlertTriangle className="size-4" /> : <Check className="size-4" />}
          {aviso.texto}
        </div>
      )}
    </div>
  );
}
