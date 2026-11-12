"use client";

import { Download, MessageCircle, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Familia } from "@/lib/familias";

/** Vista previa del pase con QR: compartir (celular), descargar el PNG y abrir el chat de WhatsApp. */
export function PaseQr({
  familia: f,
  whatsapp,
  onCerrar,
}: {
  familia: Familia;
  /** Número para wa.me, si la familia tiene teléfono. */
  whatsapp: string | null;
  onCerrar: () => void;
}) {
  const src = `/admin/qr/${f.id}`;
  const archivo = `pase-${f.slug}.png`;
  const mensaje = `¡Hola, ${f.nombre}! Les compartimos su pase de entrada a nuestra boda. Por favor preséntenlo en la entrada del salón (en el celular o impreso).\n\nTania & Raymundo`;
  // El diálogo solo se monta en el navegador (tras un clic), así que podemos preguntar al momento.
  const [puedeCompartir] = useState(
    () => typeof navigator !== "undefined" && Boolean(navigator.canShare?.({ files: [new File([""], archivo, { type: "image/png" })] })),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onCerrar]);

  async function compartir() {
    setError(null);
    try {
      const r = await fetch(src);
      if (!r.ok) throw new Error();
      const imagen = new File([await r.blob()], archivo, { type: "image/png" });
      await navigator.share({ files: [imagen], text: mensaje });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setError("No se pudo compartir; descarga la imagen.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-zinc-900/50 p-4 [animation:aparecer_.15s_ease]" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal
        aria-label={`Pase de ${f.nombre}`}
        className="relative w-full max-w-sm rounded-xl bg-white p-4 shadow-xl [animation:subir_.2s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-zinc-900">Pase de {f.nombre}</h3>
            <p className="text-[0.8rem] text-zinc-500">
              {f.asistencia === "si"
                ? `Para los ${f.asistentes?.length ?? 0} confirmados`
                : `Aún no confirman: ampara a sus ${f.invitados.length} invitados`}
            </p>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">
            <X className="size-4" />
          </button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element -- PNG generado al momento por el servidor */}
        <img src={src} alt={`Pase con QR de ${f.nombre}`} className="mt-3 aspect-[4/5] w-full rounded-lg border border-zinc-200 bg-zinc-50" />

        <div className="mt-4 grid gap-2">
          {puedeCompartir && (
            <button onClick={compartir} className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-700">
              <Share2 className="size-4" /> Compartir (WhatsApp)
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <a href={`${src}?descargar`} download={archivo} className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 py-2.5 font-medium text-zinc-800 hover:bg-zinc-50">
              <Download className="size-4" /> Descargar
            </a>
            <button
              disabled={!whatsapp}
              title={whatsapp ? "Abre el chat; adjunta la imagen descargada" : "Agrega un teléfono a la familia"}
              onClick={() => whatsapp && window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener")}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-200 py-2.5 font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MessageCircle className="size-4" /> Abrir chat
            </button>
          </div>
          {!puedeCompartir && (
            <p className="text-center text-[0.8rem] text-zinc-500">En computadora: descarga la imagen y adjúntala en el chat.</p>
          )}
          {error && <p className="text-center text-[0.8rem] text-rose-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
