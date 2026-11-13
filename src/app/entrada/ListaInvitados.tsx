"use client";

import { ChevronRight, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { faltanDe, hora, mesasTexto, type Pase } from "./tipos";

type Filtro = "faltan" | "llegaron" | "sin" | "todos";

const FILTROS: { id: Filtro; nombre: string }[] = [
  { id: "faltan", nombre: "Por llegar" },
  { id: "llegaron", nombre: "Llegaron" },
  { id: "sin", nombre: "Sin confirmar" },
  { id: "todos", nombre: "Todos" },
];

const sinAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Buscar a quien no trae su QR y ver de un vistazo quién falta. */
export function ListaInvitados({
  pases,
  onAbrir,
  enfocar,
}: {
  pases: Pase[];
  onAbrir: (codigo: string) => void;
  enfocar: boolean;
}) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("faltan");

  const grupos = useMemo(
    () => ({
      faltan: pases.filter((p) => p.asistencia === "si" && faltanDe(p).length > 0),
      llegaron: pases
        .filter((p) => p.llegaron.length > 0)
        .sort((a, b) => (b.llegadaAt ?? "").localeCompare(a.llegadaAt ?? "")),
      sin: pases.filter((p) => p.asistencia === "pendiente"),
      todos: pases,
    }),
    [pases],
  );

  const t = sinAcentos(q.trim());
  const buscando = t.length >= 2;
  const lista = buscando
    ? pases
        .map((p) => ({ p, invitado: sinAcentos(p.nombre).includes(t) ? null : p.invitados.find((n) => sinAcentos(n).includes(t)) }))
        .filter(({ p, invitado }) => invitado !== undefined || sinAcentos(p.nombre).includes(t))
    : grupos[filtro].map((p) => ({ p, invitado: null }));

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 bg-zinc-950/95 px-4 pb-3 pt-1 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={q}
            autoFocus={enfocar}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Familia o nombre del invitado"
            className="h-12 w-full rounded-2xl bg-white/[0.07] pl-11 pr-11 text-base text-white outline-none ring-1 ring-white/10 placeholder:text-zinc-500 focus:ring-2 focus:ring-rose-400/60 [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Borrar búsqueda"
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-zinc-400 hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {!buscando && (
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 font-medium transition-colors ${
                  filtro === f.id ? "bg-white text-zinc-900" : "bg-white/[0.07] text-zinc-300"
                }`}
              >
                {f.nombre}
                <span className={`num text-[0.8rem] ${filtro === f.id ? "text-zinc-500" : "text-zinc-500"}`}>{grupos[f.id].length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {lista.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">
          {buscando ? "Nadie con ese nombre." : filtro === "faltan" ? "¡Ya llegaron todos los confirmados!" : "Nada por aquí."}
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
          {lista.map(({ p, invitado }) => (
            <li key={p.id}>
              <Fila pase={p} invitado={invitado} onAbrir={onAbrir} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Fila({ pase: p, invitado, onAbrir }: { pase: Pase; invitado: string | null | undefined; onAbrir: (c: string) => void }) {
  const total = p.esperados.length || p.invitados.length;
  const completo = p.llegaron.length > 0 && faltanDe(p).length === 0;
  const detalle = invitado
    ? `Incluye a ${invitado}`
    : p.asistencia === "no"
      ? "No asistirán"
      : p.asistencia === "pendiente"
        ? "Sin confirmar"
        : p.llegaron.length && p.llegadaAt
          ? `Llegaron ${hora(p.llegadaAt)}${mesasTexto(p) ? ` · ${mesasTexto(p)}` : ""}`
          : mesasTexto(p) || "Sin mesa asignada";

  return (
    <button onClick={() => onAbrir(p.codigo)} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left active:bg-white/[0.06]">
      <span
        className={`size-2.5 shrink-0 rounded-full ${
          completo ? "bg-emerald-400" : p.llegaron.length ? "bg-amber-400" : p.asistencia === "si" ? "bg-zinc-600" : "bg-rose-500/70"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.95rem] font-medium text-zinc-100">{p.nombre}</p>
        <p className="truncate text-[0.8rem] text-zinc-500">{detalle}</p>
      </div>
      <span
        className={`num shrink-0 rounded-lg px-2 py-1 text-[0.8rem] ${
          completo ? "bg-emerald-500/15 text-emerald-300" : p.llegaron.length ? "bg-amber-400/15 text-amber-200" : "bg-white/[0.06] text-zinc-400"
        }`}
      >
        {p.llegaron.length}/{total}
      </span>
      <ChevronRight className="size-4 shrink-0 text-zinc-600" />
    </button>
  );
}
