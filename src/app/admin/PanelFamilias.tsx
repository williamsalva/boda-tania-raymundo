"use client";

import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserX,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Familia } from "@/lib/familias";
import { borrarFamilia } from "./acciones";
import { FormFamilia } from "./FormFamilia";

type Filtro = "todas" | Familia["asistencia"];
type Orden = "nombre" | "recientes" | "invitados";

const FILTROS: [Filtro, string][] = [
  ["todas", "Todas"],
  ["pendiente", "Pendientes"],
  ["si", "Confirmaron"],
  ["no", "No asistirán"],
];

const ESTADO = {
  pendiente: { texto: "Pendiente", pill: "bg-amber-50 text-amber-700 ring-amber-600/20", punto: "bg-amber-500" },
  si: { texto: "Confirmó", pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", punto: "bg-emerald-500" },
  no: { texto: "No asistirá", pill: "bg-rose-50 text-rose-700 ring-rose-600/20", punto: "bg-rose-500" },
} as const;

const AVATARES = [
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-fuchsia-100 text-fuchsia-700",
];

const sinAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function iniciales(nombre: string) {
  const palabras = nombre.replace(/^familia\s+/i, "").split(/\s+/).filter(Boolean);
  return (palabras[0]?.[0] ?? "") + (palabras[1]?.[0] ?? "");
}

function colorAvatar(texto: string) {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATARES[h % AVATARES.length];
}

/** Número para wa.me: solo dígitos; los de 10 dígitos se asumen de México (+52). */
function numeroWhatsApp(telefono: string) {
  const digitos = telefono.replace(/\D/g, "");
  return digitos.length === 10 ? `52${digitos}` : digitos;
}

/** 3312345678 → 33 1234 5678 (los de otro largo se muestran como vienen). */
function formatoTelefono(telefono: string) {
  const d = telefono.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`;
  if (d.length === 12 && d.startsWith("52")) return `+52 ${d.slice(2, 4)} ${d.slice(4, 8)} ${d.slice(8)}`;
  return telefono;
}

const enlace = (slug: string) => `${window.location.origin}/${slug}`;

function fechaCorta(fecha: string | null) {
  return fecha ? new Date(fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : null;
}

// ——— Piezas ———

function Estado({ asistencia }: { asistencia: Familia["asistencia"] }) {
  const e = ESTADO[asistencia];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${e.pill}`}>
      <span className={`size-1.5 rounded-full ${e.punto}`} />
      {e.texto}
    </span>
  );
}

function Avatar({ nombre }: { nombre: string }) {
  return (
    <span className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold uppercase ${colorAvatar(nombre)}`}>
      {iniciales(nombre)}
    </span>
  );
}

function Asistencia({ familia }: { familia: Familia }) {
  const total = familia.invitados.length;
  const van = familia.asistentes?.length ?? 0;
  const respondio = familia.asistencia !== "pendiente";
  return (
    <div className="min-w-24">
      <p className="num text-zinc-900">
        {respondio ? van : "—"}
        <span className="text-zinc-400"> / {total}</span>
      </p>
      <div className="mt-1.5 flex h-1 overflow-hidden rounded-full bg-zinc-100">
        {respondio && (
          <>
            <div className="bg-emerald-500" style={{ width: `${(van / total) * 100}%` }} />
            <div className="bg-rose-300" style={{ width: `${((total - van) / total) * 100}%` }} />
          </>
        )}
      </div>
    </div>
  );
}

function BotonIcono({
  titulo,
  onClick,
  disabled,
  children,
}: {
  titulo: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className="grid size-8 cursor-pointer place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function Menu({ opciones }: { opciones: { texto: string; icono: React.ReactNode; onClick: () => void; peligro?: boolean }[] }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAbierto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  return (
    <div ref={ref} className="relative">
      <BotonIcono titulo="Más acciones" onClick={() => setAbierto((a) => !a)}>
        <MoreHorizontal className="size-4" />
      </BotonIcono>
      {abierto && (
        <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white p-1 shadow-lg [animation:aparecer_.12s_ease]">
          {opciones.map((o) => (
            <button
              key={o.texto}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAbierto(false);
                o.onClick();
              }}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left ${
                o.peligro ? "text-rose-600 hover:bg-rose-50" : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {o.icono}
              {o.texto}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Detalle({ familia }: { familia: Familia }) {
  return (
    <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Invitados</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {familia.invitados.map((n) => {
            const respondio = familia.asistencia !== "pendiente";
            const va = familia.asistentes?.includes(n);
            return (
              <li
                key={n}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 ${
                  !respondio
                    ? "border-zinc-200 bg-white text-zinc-700"
                    : va
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-zinc-200 bg-zinc-50 text-zinc-400 line-through"
                }`}
              >
                {respondio && (va ? <Check className="size-3.5" /> : <UserX className="size-3.5" />)}
                {n}
              </li>
            );
          })}
        </ul>
        {familia.mensaje && (
          <blockquote className="mt-4 border-l-2 border-zinc-300 pl-3 italic text-zinc-600">“{familia.mensaje}”</blockquote>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[0.8rem] sm:grid-cols-1">
        <div>
          <dt className="text-zinc-500">Enlace</dt>
          <dd className="font-medium text-zinc-900">/{familia.slug}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Respondió</dt>
          <dd className="font-medium text-zinc-900">{fechaCorta(familia.confirmado_at) ?? "Aún no"}</dd>
        </div>
      </dl>
    </div>
  );
}

// ——— Diálogo para eliminar ———

function ConfirmarEliminar({ familia, onCancelar, onEliminar, eliminando }: {
  familia: Familia;
  onCancelar: () => void;
  onEliminar: () => void;
  eliminando: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-900/40 p-4 [animation:aparecer_.15s_ease]" onClick={onCancelar}>
      <div
        role="alertdialog"
        aria-modal
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl [animation:subir_.2s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="grid size-10 place-items-center rounded-full bg-rose-50 text-rose-600">
          <Trash2 className="size-5" />
        </span>
        <h3 className="mt-4 text-base font-semibold text-zinc-900">¿Eliminar a {familia.nombre}?</h3>
        <p className="mt-1.5 text-zinc-500">
          Se borrarán sus {familia.invitados.length} lugares y su respuesta. El enlace /{familia.slug} dejará de funcionar.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancelar} className="cursor-pointer rounded-lg border border-zinc-200 px-3.5 py-2 font-medium hover:bg-zinc-50">
            Cancelar
          </button>
          <button
            onClick={onEliminar}
            disabled={eliminando}
            className="cursor-pointer rounded-lg bg-rose-600 px-3.5 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {eliminando ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ——— Panel ———

export function PanelFamilias({ familias }: { familias: Familia[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [orden, setOrden] = useState<Orden>("nombre");
  const [abierta, setAbierta] = useState<string | null>(null);
  // null = cerrado, "nueva" = alta, o el id de la familia en edición
  const [editando, setEditando] = useState<string | null>(null);
  const [porEliminar, setPorEliminar] = useState<Familia | null>(null);
  const [eliminando, iniciarEliminar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2600);
    return () => clearTimeout(t);
  }, [aviso]);

  const visibles = useMemo(() => {
    const q = sinAcentos(busqueda.trim());
    const digitos = q.replace(/\D/g, "");
    const lista = familias.filter(
      (f) =>
        (filtro === "todas" || f.asistencia === filtro) &&
        (!q ||
          sinAcentos(f.nombre).includes(q) ||
          f.invitados.some((n) => sinAcentos(n).includes(q)) ||
          (digitos.length > 2 && (f.telefono ?? "").replace(/\D/g, "").includes(digitos))),
    );
    return lista.sort((a, b) =>
      orden === "recientes"
        ? (b.confirmado_at ?? "").localeCompare(a.confirmado_at ?? "")
        : orden === "invitados"
          ? b.invitados.length - a.invitados.length
          : a.nombre.localeCompare(b.nombre, "es"),
    );
  }, [familias, busqueda, filtro, orden]);

  const enEdicion = familias.find((f) => f.id === editando);

  function copiar(f: Familia) {
    navigator.clipboard.writeText(enlace(f.slug));
    setAviso(`Enlace de ${f.nombre} copiado`);
  }

  function whatsapp(f: Familia) {
    if (!f.telefono) return;
    const mensaje = `¡Hola, ${f.nombre}! Con mucho cariño les compartimos la invitación a nuestra boda. Ahí pueden confirmar su asistencia: ${enlace(f.slug)}\n\nTania & Raymundo`;
    window.open(`https://wa.me/${numeroWhatsApp(f.telefono)}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener");
  }

  function eliminar() {
    if (!porEliminar) return;
    const f = porEliminar;
    iniciarEliminar(async () => {
      const datos = new FormData();
      datos.set("id", f.id);
      await borrarFamilia(datos);
      setPorEliminar(null);
      setAviso(`${f.nombre} eliminada`);
    });
  }

  const acciones = (f: Familia) => (
    <div className="flex items-center justify-end gap-0.5">
      <BotonIcono titulo="Copiar enlace" onClick={() => copiar(f)}>
        <Copy className="size-4" />
      </BotonIcono>
      <BotonIcono
        titulo={f.telefono ? "Enviar por WhatsApp" : "Agrega un teléfono para enviar por WhatsApp"}
        onClick={() => whatsapp(f)}
        disabled={!f.telefono}
      >
        <MessageCircle className="size-4" />
      </BotonIcono>
      <Menu
        opciones={[
          { texto: "Editar", icono: <Pencil className="size-4" />, onClick: () => setEditando(f.id) },
          { texto: "Ver invitación", icono: <ExternalLink className="size-4" />, onClick: () => window.open(`/${f.slug}`, "_blank") },
          { texto: "Eliminar", icono: <Trash2 className="size-4" />, onClick: () => setPorEliminar(f), peligro: true },
        ]}
      />
    </div>
  );

  return (
    <section id="familias" className="mt-10 scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Familias</h2>
          <p className="text-zinc-500">Agrega familias, sus invitados y envíales su enlace.</p>
        </div>
        <button
          onClick={() => setEditando("nueva")}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
        >
          <Plus className="size-4" /> Agregar familia
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {/* Barra de herramientas */}
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 p-3">
          <div className="flex max-w-full overflow-x-auto rounded-lg bg-zinc-100 p-0.5 [scrollbar-width:none]">
            {FILTROS.map(([valor, texto]) => {
              const n = valor === "todas" ? familias.length : familias.filter((f) => f.asistencia === valor).length;
              return (
                <button
                  key={valor}
                  onClick={() => setFiltro(valor)}
                  className={`cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-[0.8rem] font-medium transition-colors ${
                    filtro === valor ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {texto} <span className="num ml-0.5 text-zinc-400">{n}</span>
                </button>
              );
            })}
          </div>
          <div className="relative min-w-0 flex-1 basis-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar familia, invitado o teléfono"
              className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-8 pr-3 outline-none transition-shadow placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
            />
          </div>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[0.8rem] text-zinc-700 outline-none focus:border-zinc-400"
            aria-label="Ordenar"
          >
            <option value="nombre">Orden: nombre</option>
            <option value="recientes">Orden: respuesta reciente</option>
            <option value="invitados">Orden: más invitados</option>
          </select>
        </div>

        {visibles.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-medium text-zinc-900">
              {familias.length ? "Sin resultados" : "Aún no hay familias"}
            </p>
            <p className="mt-1 text-zinc-500">
              {familias.length ? "Prueba con otra búsqueda o filtro." : "Agrega la primera para generar su enlace."}
            </p>
          </div>
        ) : (
          <>
            {/* Tabla (escritorio) */}
            <table className="hidden w-full md:table">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-left text-xs font-medium text-zinc-500">
                  <th className="py-2.5 pl-4 pr-3 font-medium">Familia</th>
                  <th className="px-3 font-medium">Asistencia</th>
                  <th className="px-3 font-medium">Estado</th>
                  <th className="px-3 font-medium">Teléfono</th>
                  <th className="px-3 font-medium">Respondió</th>
                  <th className="w-32 pr-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {visibles.map((f) => {
                  const expandida = abierta === f.id;
                  return (
                    <FilaTabla
                      key={f.id}
                      familia={f}
                      expandida={expandida}
                      onAlternar={() => setAbierta(expandida ? null : f.id)}
                      acciones={acciones(f)}
                    />
                  );
                })}
              </tbody>
            </table>

            {/* Tarjetas (móvil) */}
            <ul className="divide-y divide-zinc-100 md:hidden">
              {visibles.map((f) => {
                const expandida = abierta === f.id;
                return (
                  <li key={f.id} className="p-4">
                    <div className="flex items-start gap-3" onClick={() => setAbierta(expandida ? null : f.id)}>
                      <Avatar nombre={f.nombre} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-900">{f.nombre}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-[0.8rem] text-zinc-500">
                          <span className="num">
                            {f.asistencia === "pendiente" ? "—" : (f.asistentes?.length ?? 0)} / {f.invitados.length}
                          </span>
                          {f.telefono && <span className="num truncate">· {formatoTelefono(f.telefono)}</span>}
                        </p>
                      </div>
                      <Estado asistencia={f.asistencia} />
                    </div>
                    {expandida && (
                      <div className="mt-4 rounded-lg bg-zinc-50 p-3 [animation:aparecer_.15s_ease]">
                        <Detalle familia={f} />
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => setAbierta(expandida ? null : f.id)}
                        className="flex cursor-pointer items-center gap-1 text-[0.8rem] text-zinc-500"
                      >
                        <ChevronDown className={`size-4 transition-transform ${expandida ? "rotate-180" : ""}`} />
                        {expandida ? "Ocultar" : "Ver invitados"}
                      </button>
                      {acciones(f)}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-zinc-200 px-4 py-2.5 text-[0.8rem] text-zinc-500">
              Mostrando <span className="num text-zinc-900">{visibles.length}</span> de{" "}
              <span className="num text-zinc-900">{familias.length}</span> familias
            </div>
          </>
        )}
      </div>

      {(editando === "nueva" || enEdicion) && (
        <FormFamilia
          key={editando}
          familia={enEdicion}
          onCerrar={() => setEditando(null)}
          onGuardado={(nombre) => setAviso(enEdicion ? `Cambios guardados en ${nombre}` : `${nombre} agregada`)}
        />
      )}

      {porEliminar && (
        <ConfirmarEliminar
          familia={porEliminar}
          onCancelar={() => setPorEliminar(null)}
          onEliminar={eliminar}
          eliminando={eliminando}
        />
      )}

      {aviso && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-white shadow-lg [animation:subir_.2s_ease] sm:left-auto sm:right-6 sm:translate-x-0"
        >
          <span className="grid size-5 place-items-center rounded-full bg-emerald-500">
            <Check className="size-3.5" />
          </span>
          {aviso}
        </div>
      )}
    </section>
  );
}

function FilaTabla({
  familia: f,
  expandida,
  onAlternar,
  acciones,
}: {
  familia: Familia;
  expandida: boolean;
  onAlternar: () => void;
  acciones: React.ReactNode;
}) {
  return (
    <>
      <tr onClick={onAlternar} className={`cursor-pointer transition-colors hover:bg-zinc-50 ${expandida ? "bg-zinc-50" : ""}`}>
        <td className="py-3 pl-4 pr-3">
          <div className="flex items-center gap-3">
            <ChevronDown className={`size-4 shrink-0 text-zinc-400 transition-transform ${expandida ? "rotate-180" : "-rotate-90"}`} />
            <Avatar nombre={f.nombre} />
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-900">{f.nombre}</p>
              <p className="truncate text-[0.8rem] text-zinc-500">
                {f.invitados.length} {f.invitados.length === 1 ? "invitado" : "invitados"} · /{f.slug}
              </p>
            </div>
          </div>
        </td>
        <td className="px-3">
          <Asistencia familia={f} />
        </td>
        <td className="px-3">
          <Estado asistencia={f.asistencia} />
        </td>
        <td className="px-3 text-zinc-600">
          {f.telefono ? (
            <a href={`tel:${f.telefono}`} onClick={(e) => e.stopPropagation()} className="num inline-flex items-center gap-1.5 hover:text-zinc-900">
              <Phone className="size-3.5 text-zinc-400" />
              {formatoTelefono(f.telefono)}
            </a>
          ) : (
            <span className="text-zinc-400">—</span>
          )}
        </td>
        <td className="px-3 text-zinc-600">{fechaCorta(f.confirmado_at) ?? <span className="text-zinc-400">—</span>}</td>
        <td className="pr-3">{acciones}</td>
      </tr>
      {expandida && (
        <tr className="bg-zinc-50">
          <td colSpan={6} className="px-4 pb-5 pl-[4.25rem] pt-1 [animation:aparecer_.15s_ease]">
            <Detalle familia={f} />
          </td>
        </tr>
      )}
    </>
  );
}
