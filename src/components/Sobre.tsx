"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { NOVIOS } from "@/lib/boda";
import { Esquinas } from "./Ornamentos";

/**
 * Pantalla de bienvenida: sobre rubor con solapa, sello de lacre T&R y ramitas a línea.
 * Se abre al tocar el sobre o el botón.
 */
export function Sobre({ para }: { para?: string }) {
  const [estado, setEstado] = useState<"cerrado" | "abriendo" | "abierto">("cerrado");

  useEffect(() => {
    document.documentElement.style.overflow = estado === "abierto" ? "" : "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [estado]);

  if (estado === "abierto") return null;

  function abrir() {
    if (estado !== "cerrado") return;
    setEstado("abriendo");
    setTimeout(() => {
      setEstado("abierto");
    }, 1100);
  }

  const abriendo = estado === "abriendo";

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-perla px-4 py-8 overflow-y-auto transition-all duration-700 ease-out ${
        abriendo ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
      role="dialog"
      aria-label="Invitación de boda de Tania y Raymundo"
    >
      {/* Marco de flores de acuarela en las cuatro esquinas */}
      <Esquinas tam="w-[19vw] max-w-[155px] sm:w-[16vw]" />

      {/* Contenedor principal centrado */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-lg my-auto py-4 z-10">
        {/* Encabezado superior */}
        <div className="text-center mb-6 sm:mb-8 select-none">
          <p className="etiqueta text-rosa mb-2">Nuestra boda</p>
          <h1 className="font-script text-[2.75rem] sm:text-5xl md:text-6xl text-vino leading-tight">
            {NOVIOS.ellaCorto}{" "}
            <span className="text-rosa">&amp;</span>{" "}
            {NOVIOS.elCorto}
          </h1>
          {para && (
            <p className="font-serif italic text-lg sm:text-xl text-tinta mt-3">
              Con cariño para {para}
            </p>
          )}
        </div>

        {/* Sobre rosa interactivo */}
        <div
          onClick={abrir}
          className="group relative w-full max-w-[390px] sm:max-w-[430px] aspect-[1.42/1] cursor-pointer select-none transition-transform duration-300 hover:scale-[1.015] active:scale-[0.99]"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              abrir();
            }
          }}
          aria-label="Toca el sobre o el sello para abrir la invitación"
        >
          {/* Cuerpo del sobre */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-rubor via-rubor-2 to-[#f1d6e3] shadow-[0_22px_55px_-12px_rgba(155,37,72,0.28),0_10px_25px_-5px_rgba(155,37,72,0.12)] border border-rosa/20 overflow-hidden">
            {/* Pliegues interiores y solapa del sobre */}
            <svg
              viewBox="0 0 430 300"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="pliegueIzq" x1="0%" y1="100%" x2="50%" y2="65%">
                  <stop offset="0%" stopColor="#ecd0de" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#fbeef4" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="pliegueDer" x1="100%" y1="100%" x2="50%" y2="65%">
                  <stop offset="0%" stopColor="#ecd0de" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#fbeef4" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="solapaGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#fcf0f5" />
                  <stop offset="65%" stopColor="#f6e0eb" />
                  <stop offset="100%" stopColor="#efd1e0" />
                </linearGradient>
                <filter id="sombraSolapa" x="-10%" y="0%" width="120%" height="150%">
                  <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#9b2548" floodOpacity="0.2" />
                </filter>
              </defs>

              {/* Pliegue diagonal inferior izquierdo */}
              <polygon points="0,300 215,198 0,95" fill="url(#pliegueIzq)" opacity="0.65" />
              {/* Pliegue diagonal inferior derecho */}
              <polygon points="430,300 215,198 430,95" fill="url(#pliegueDer)" opacity="0.65" />
              {/* Pliegue inferior hacia el centro */}
              <polygon points="0,300 430,300 215,198" fill="#f3dbe7" opacity="0.55" />

              {/* Líneas sutiles de costura / pliegue de papel */}
              <line x1="0" y1="300" x2="215" y2="198" stroke="#e6bfd3" strokeWidth="0.8" opacity="0.65" />
              <line x1="430" y1="300" x2="215" y2="198" stroke="#e6bfd3" strokeWidth="0.8" opacity="0.65" />

              {/* Solapa triangular superior con sombra cayendo sobre el cuerpo */}
              <polygon
                points="0,0 430,0 215,198"
                fill="url(#solapaGrad)"
                stroke="#ecc8da"
                strokeWidth="0.8"
                filter="url(#sombraSolapa)"
              />
            </svg>

            {/* Frase sobre la solapa */}
            <div className="absolute inset-x-0 top-5 sm:top-7 flex flex-col items-center text-center pointer-events-none select-none z-10 px-4 text-vino">
              <p className="etiqueta !text-[0.6rem] sm:!text-[0.68rem] text-vino/80">El comienzo de</p>
              <p className="font-script text-3xl sm:text-4xl leading-tight">nuestro para siempre</p>
            </div>
          </div>

          {/* Sello de Lacre colocado exactamente sobre la punta de la solapa */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 top-[66%] -translate-y-1/2 z-20 size-24 sm:size-28 md:size-32 transition-all duration-300 group-hover:scale-105 active:scale-95 ${
              abriendo ? "scale-110 opacity-0" : ""
            }`}
            style={{ animation: abriendo ? "none" : "flotar 3.5s ease-in-out infinite" }}
          >
            <Image
              src="/ilustraciones/sello_lacre_tr.png"
              alt="Sello de lacre con iniciales T y R — Toca para abrir"
              width={160}
              height={160}
              className="w-full h-full object-contain drop-shadow-[0_12px_22px_rgba(70,18,35,0.45)] transition-transform duration-300 group-hover:rotate-2"
              priority
            />
          </div>

        </div>

        {/* Botón inferior */}
        <div className="mt-8 sm:mt-10 text-center select-none">
          <button
            type="button"
            onClick={abrir}
            className="group inline-flex flex-col items-center gap-1 focus:outline-none cursor-pointer p-2"
          >
            <span className="etiqueta text-vino transition-colors group-hover:text-fucsia">
              Toca para abrir
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
