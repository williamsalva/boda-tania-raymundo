"use client";

import jsQR from "jsqr";
import { Camera, CameraOff, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const CODIGO = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

/** Acepta la URL completa del pase (…/entrada/<codigo>) o solo el código. */
export function codigoDe(texto: string) {
  return texto.match(CODIGO)?.[1]?.toLowerCase() ?? null;
}

type Estado = "iniciando" | "escaneando" | "sin-permiso" | "sin-camara" | "leido";

export function Escaner() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const lienzo = useRef<HTMLCanvasElement | null>(null);
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [aviso, setAviso] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const leido = useCallback(
    (texto: string) => {
      const codigo = codigoDe(texto);
      if (!codigo) {
        setAviso("Ese QR no es un pase de la boda.");
        return false;
      }
      navigator.vibrate?.(80);
      setEstado("leido");
      router.push(`/entrada/${codigo}`);
      return true;
    },
    [router],
  );

  useEffect(() => {
    let flujo: MediaStream | null = null;
    let cuadro = 0;
    let activo = true;

    async function iniciar() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setEstado("sin-camara");
        return;
      }
      try {
        flujo = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (e) {
        setEstado(e instanceof DOMException && e.name === "NotAllowedError" ? "sin-permiso" : "sin-camara");
        return;
      }
      if (!activo || !video.current) return flujo.getTracks().forEach((t) => t.stop());
      video.current.srcObject = flujo;
      await video.current.play().catch(() => {});
      setEstado("escaneando");
      buscar();
    }

    function buscar() {
      if (!activo) return;
      const v = video.current;
      if (v && v.readyState >= v.HAVE_ENOUGH_DATA && v.videoWidth) {
        // Reducimos el cuadro para que la lectura sea rápida incluso en celulares modestos.
        const escala = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
        const w = Math.round(v.videoWidth * escala);
        const h = Math.round(v.videoHeight * escala);
        const c = (lienzo.current ??= document.createElement("canvas"));
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0, w, h);
          const qr = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
          if (qr?.data && leido(qr.data)) return;
        }
      }
      cuadro = requestAnimationFrame(buscar);
    }

    iniciar();
    return () => {
      activo = false;
      cancelAnimationFrame(cuadro);
      flujo?.getTracks().forEach((t) => t.stop());
    };
  }, [leido, intento]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2500);
    return () => clearTimeout(t);
  }, [aviso]);

  const problema = estado === "sin-permiso" || estado === "sin-camara";

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-sm">
      <video ref={video} muted playsInline className={`size-full object-cover ${problema ? "hidden" : ""}`} />

      {!problema && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="relative size-[68%] rounded-3xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
            {estado === "escaneando" && (
              <ScanLine className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-white/60" />
            )}
          </div>
        </div>
      )}

      {estado === "iniciando" && (
        <p className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 text-white/90">
          <Camera className="size-4" /> Abriendo la cámara…
        </p>
      )}
      {estado === "leido" && (
        <p className="absolute inset-x-0 bottom-4 text-center font-medium text-white">Pase leído, abriendo…</p>
      )}
      {aviso && (
        <p className="absolute inset-x-4 top-4 rounded-lg bg-rose-600 px-3 py-2 text-center font-medium text-white">{aviso}</p>
      )}

      {problema && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <CameraOff className="size-8 text-white/70" />
          <p className="font-medium">
            {estado === "sin-permiso" ? "Permite el acceso a la cámara para escanear." : "No se encontró una cámara disponible."}
          </p>
          <p className="text-white/60">También puedes buscar a la familia por nombre aquí abajo.</p>
          <button
            onClick={() => {
              setEstado("iniciando");
              setIntento((n) => n + 1);
            }}
            className="mt-1 cursor-pointer rounded-lg bg-white px-4 py-2 font-medium text-zinc-900"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
