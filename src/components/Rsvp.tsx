"use client";

import { useActionState, useState } from "react";
import { confirmarAsistencia } from "@/app/actions";

type Props = {
  slug: string;
  invitados: string[];
  previo: {
    asistencia: "pendiente" | "si" | "no";
    asistentes: string[] | null;
    mensaje: string | null;
    telefono: string | null;
  };
};

const campo =
  "w-full rounded-none border-0 border-b border-vino/30 bg-transparent px-1 py-2 font-serif text-lg text-tinta placeholder:text-tinta/40 focus:border-vino focus:outline-none focus:ring-0";

export function Rsvp({ slug, invitados, previo }: Props) {
  const [estado, accion, enviando] = useActionState(confirmarAsistencia, null);
  const [marcados, setMarcados] = useState<string[]>(previo.asistentes ?? []);
  const [confirmados, setConfirmados] = useState<string[] | null>(
    previo.asistencia === "pendiente" ? null : (previo.asistentes ?? []),
  );
  const [editando, setEditando] = useState(previo.asistencia === "pendiente");

  // Al llegar una nueva respuesta exitosa del servidor, mostramos el agradecimiento.
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    if (estado?.ok) {
      setConfirmados(invitados.filter((n) => marcados.includes(n)));
      setEditando(false);
    }
  }

  function alternar(nombre: string) {
    setMarcados((m) => (m.includes(nombre) ? m.filter((n) => n !== nombre) : [...m, nombre]));
  }

  if (!editando && confirmados) {
    const vienen = confirmados.length > 0;
    return (
      <div className="text-center space-y-5">
        <p className="font-script text-5xl text-vino">{vienen ? "¡Gracias!" : "Los extrañaremos"}</p>
        {vienen ? (
          <>
            <p className="text-xl leading-relaxed max-w-md mx-auto">
              Recibimos su confirmación. Nos hace muy felices que nos acompañen en este día tan
              especial.
            </p>
            <ul className="space-y-1 text-lg">
              {confirmados.map((n) => (
                <li key={n}>
                  <span className="text-vino mr-2">✓</span>
                  {n}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-xl leading-relaxed max-w-md mx-auto">
            Gracias por avisarnos. Los llevaremos en el corazón ese día.
          </p>
        )}
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="etiqueta text-vino underline underline-offset-8 decoration-rosa/50 hover:text-vino cursor-pointer"
        >
          Modificar respuesta
        </button>
      </div>
    );
  }

  const total = marcados.length;

  return (
    <form action={accion} className="space-y-8 max-w-md mx-auto text-left">
      <input type="hidden" name="slug" value={slug} />

      <fieldset>
        <legend className="etiqueta text-vino mb-2 block text-center w-full">
          ¿Quiénes nos acompañan?
        </legend>
        <p className="text-center text-base text-tinta/70 mb-5">
          Marca a cada persona que asistirá.
        </p>
        <ul className="space-y-3">
          {invitados.map((nombre) => {
            const activo = marcados.includes(nombre);
            return (
              <li key={nombre}>
                <label
                  className={`flex cursor-pointer items-center gap-4 border px-4 py-3.5 text-lg transition-colors ${
                    activo
                      ? "border-vino bg-vino/5"
                      : "border-vino/25 bg-perla hover:border-rosa"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="asistentes"
                    value={nombre}
                    checked={activo}
                    onChange={() => alternar(nombre)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={`flex size-6 shrink-0 items-center justify-center border text-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-rosa/50 ${
                      activo ? "border-vino bg-vino text-white" : "border-vino/40 bg-white"
                    }`}
                  >
                    {activo && "✓"}
                  </span>
                  <span className="flex-1">{nombre}</span>
                  <span className={`etiqueta !text-[0.6rem] ${activo ? "text-vino" : "text-tinta/40"}`}>
                    {activo ? "Asistirá" : "No asistirá"}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <label className="block">
        <span className="etiqueta text-vino">Teléfono (opcional)</span>
        <input
          name="telefono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={previo.telefono ?? ""}
          className={`${campo} mt-2`}
        />
      </label>

      <label className="block">
        <span className="etiqueta text-vino">Un mensaje para los novios (opcional)</span>
        <textarea
          name="mensaje"
          rows={3}
          defaultValue={previo.mensaje ?? ""}
          className={`${campo} mt-2 resize-none`}
        />
      </label>

      {estado?.error && (
        <p role="alert" className="text-center text-vino">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-vino py-4 etiqueta !text-sm text-white transition-colors hover:bg-orquidea disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {enviando
          ? "Enviando…"
          : total > 0
            ? `Confirmar ${total} de ${invitados.length}`
            : "Ninguno podrá asistir"}
      </button>
    </form>
  );
}
