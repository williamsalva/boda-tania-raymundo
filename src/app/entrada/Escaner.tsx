"use client";

import jsQR from "jsqr";
import { Camera, CameraOff, Flashlight, FlashlightOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CODIGO = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

/** Acepta la URL completa del pase (…/entrada/<codigo>) o solo el código. */
export function codigoDe(texto: string) {
  return texto.match(CODIGO)?.[1]?.toLowerCase() ?? null;
}

type Estado = "iniciando" | "escaneando" | "sin-permiso" | "sin-camara";

/** Cada cuánto analizar un cuadro: suficiente para leer al instante sin acabarse la batería. */
const INTERVALO_MS = 110;
/** Tras cerrar una ficha, el mismo QR suele seguir frente a la cámara: no lo reabrimos de inmediato. */
const ENFRIAMIENTO_MS = 3500;

/**
 * Cámara siempre encendida. Con `pausado` (ficha abierta) deja de leer, pero no apaga la cámara,
 * así el siguiente pase se lee sin esperar a que arranque otra vez.
 */
export function Escaner({ pausado, onCodigo }: { pausado: boolean; onCodigo: (codigo: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const pista = useRef<MediaStreamTrack | null>(null);
  const pausadoRef = useRef(pausado);
  const onCodigoRef = useRef(onCodigo);
  const ultimo = useRef<{ codigo: string; hasta: number } | null>(null);
  const avisadoEn = useRef(0);
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [aviso, setAviso] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [linterna, setLinterna] = useState<"no" | "apagada" | "encendida">("no");

  useEffect(() => {
    onCodigoRef.current = onCodigo;
  }, [onCodigo]);

  useEffect(() => {
    pausadoRef.current = pausado;
    // Al reanudar, ignoramos un momento el último pase leído.
    if (!pausado && ultimo.current) ultimo.current = { ...ultimo.current, hasta: Date.now() + ENFRIAMIENTO_MS };
  }, [pausado]);

  useEffect(() => {
    let flujo: MediaStream | null = null;
    let cuadro = 0;
    let activo = true;
    let analizadoEn = 0;
    const lienzo = document.createElement("canvas");

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
      const p = flujo.getVideoTracks()[0];
      pista.current = p;
      const capacidades = p.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
      setLinterna(capacidades?.torch ? "apagada" : "no");
      video.current.srcObject = flujo;
      await video.current.play().catch(() => {});
      setEstado("escaneando");
      cuadro = requestAnimationFrame(buscar);
    }

    function buscar(ahora: number) {
      if (!activo) return;
      cuadro = requestAnimationFrame(buscar);
      const v = video.current;
      if (pausadoRef.current || ahora - analizadoEn < INTERVALO_MS) return;
      if (!v || v.readyState < v.HAVE_ENOUGH_DATA || !v.videoWidth) return;
      analizadoEn = ahora;

      // Reducimos el cuadro para que la lectura sea rápida incluso en celulares modestos.
      const escala = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
      const w = Math.round(v.videoWidth * escala);
      const h = Math.round(v.videoHeight * escala);
      lienzo.width = w;
      lienzo.height = h;
      const ctx = lienzo.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(v, 0, 0, w, h);
      const qr = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
      if (!qr?.data) return;

      const codigo = codigoDe(qr.data);
      const t = Date.now();
      if (!codigo) {
        if (t - avisadoEn.current > 3000) {
          avisadoEn.current = t;
          setAviso("Ese QR no es un pase de la boda");
        }
        return;
      }
      if (ultimo.current?.codigo === codigo && t < ultimo.current.hasta) return;
      ultimo.current = { codigo, hasta: t + ENFRIAMIENTO_MS };
      onCodigoRef.current(codigo);
    }

    // iOS corta la cámara al salir de la app; al volver, la reiniciamos.
    function alVolver() {
      if (document.visibilityState === "visible" && pista.current?.readyState === "ended") setIntento((n) => n + 1);
    }
    document.addEventListener("visibilitychange", alVolver);

    iniciar();
    return () => {
      activo = false;
      cancelAnimationFrame(cuadro);
      document.removeEventListener("visibilitychange", alVolver);
      flujo?.getTracks().forEach((t) => t.stop());
      pista.current = null;
    };
  }, [intento]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2500);
    return () => clearTimeout(t);
  }, [aviso]);

  async function alternarLinterna() {
    const encender = linterna !== "encendida";
    try {
      await pista.current?.applyConstraints({ advanced: [{ torch: encender } as unknown as MediaTrackConstraintSet] });
      setLinterna(encender ? "encendida" : "apagada");
    } catch {
      setLinterna("no");
    }
  }

  const problema = estado === "sin-permiso" || estado === "sin-camara";

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-black ring-1 ring-white/10">
      <video ref={video} muted playsInline className={`size-full object-cover ${problema ? "hidden" : ""}`} />

      {!problema && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-[14%]">
            {["left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl", "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-2xl", "right-0 bottom-0 border-r-4 border-b-4 rounded-br-2xl"].map((c) => (
              <span key={c} className={`absolute size-10 border-white ${c}`} />
            ))}
            {estado === "escaneando" && !pausado && (
              <span className="absolute inset-x-3 h-0.5 rounded-full bg-rose-400 shadow-[0_0_12px_2px_rgba(251,113,133,0.7)] [animation:barrido_2.4s_ease-in-out_infinite]" />
            )}
          </div>
        </div>
      )}

      {pausado && !problema && <div className="absolute inset-0 bg-black/55" />}

      {estado === "iniciando" && (
        <p className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-2 text-white/90">
          <Camera className="size-4" /> Abriendo la cámara…
        </p>
      )}
      {estado === "escaneando" && !pausado && (
        <p className="absolute inset-x-0 bottom-4 text-center text-[0.8rem] font-medium text-white/80 drop-shadow">
          Apunta al QR del pase
        </p>
      )}
      {aviso && (
        <p className="absolute inset-x-4 top-4 rounded-xl bg-rose-600 px-3 py-2 text-center font-medium text-white shadow-lg [animation:subir_.15s_ease]">
          {aviso}
        </p>
      )}

      {linterna !== "no" && !problema && (
        <button
          onClick={alternarLinterna}
          aria-label={linterna === "encendida" ? "Apagar linterna" : "Encender linterna"}
          aria-pressed={linterna === "encendida"}
          className={`absolute right-3 top-3 grid size-11 cursor-pointer place-items-center rounded-full backdrop-blur transition-colors ${
            linterna === "encendida" ? "bg-amber-300 text-zinc-900" : "bg-black/45 text-white"
          }`}
        >
          {linterna === "encendida" ? <Flashlight className="size-5" /> : <FlashlightOff className="size-5" />}
        </button>
      )}

      {problema && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <CameraOff className="size-8 text-white/60" />
          <p className="font-medium">
            {estado === "sin-permiso" ? "Permite el acceso a la cámara para escanear." : "No se encontró una cámara disponible."}
          </p>
          <p className="text-white/55">Mientras, puedes buscar a la familia por nombre.</p>
          <button
            onClick={() => {
              setEstado("iniciando");
              setIntento((n) => n + 1);
            }}
            className="mt-1 cursor-pointer rounded-xl bg-white px-5 py-2.5 font-medium text-zinc-900"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
