"use client";

import { useEffect, useState } from "react";

// Una sola pista para toda la página. Se crea y arranca dentro del toque que abre el sobre,
// porque los navegadores (sobre todo iOS) sólo dejan reproducir audio tras un gesto del usuario.
const CANCION = "/musica/turning-page.mp3";
let audio: HTMLAudioElement | null = null;

export function reproducirMusica() {
  if (!audio) {
    audio = new Audio(CANCION);
    audio.loop = true;
    audio.volume = 0.6;
  }
  audio.play().catch(() => {});
  window.dispatchEvent(new Event("musica"));
}

/** Botón flotante para pausar o reanudar la música; aparece una vez que empezó a sonar. */
export function BotonMusica() {
  const [visible, setVisible] = useState(false);
  const [sonando, setSonando] = useState(false);

  useEffect(() => {
    function enlazar() {
      if (!audio) return;
      setVisible(true);
      setSonando(!audio.paused);
      audio.onplay = () => setSonando(true);
      audio.onpause = () => setSonando(false);
    }
    window.addEventListener("musica", enlazar);
    return () => window.removeEventListener("musica", enlazar);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => (audio?.paused ? audio.play().catch(() => {}) : audio?.pause())}
      aria-label={sonando ? "Pausar música" : "Reproducir música"}
      className="fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full border border-vino/30 bg-perla/90 text-vino shadow-lg backdrop-blur transition-colors hover:bg-vino hover:text-white"
    >
      {sonando ? (
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
        </svg>
      )}
    </button>
  );
}
