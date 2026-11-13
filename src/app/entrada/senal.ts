import type { Tono } from "./tipos";

// Pitido y vibración al leer un pase: en la entrada hay ruido y poca luz, la planner no siempre mira la pantalla.

let audio: AudioContext | null = null;

/** Los navegadores solo dejan sonar audio después de un toque; se llama en el primer toque de la app. */
export function prepararSonido() {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
  } catch {
    audio = null;
  }
}

const NOTAS: Record<Tono, number[]> = {
  ok: [880, 1320],
  aviso: [660, 660],
  alto: [300, 220],
};

export function senal(tono: Tono) {
  navigator.vibrate?.(tono === "ok" ? 70 : [90, 70, 90]);
  const ctx = audio;
  if (!ctx || ctx.state !== "running") return;
  NOTAS[tono].forEach((frecuencia, i) => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    const t = ctx.currentTime + i * 0.13;
    osc.type = tono === "alto" ? "triangle" : "sine";
    osc.frequency.value = frecuencia;
    vol.gain.setValueAtTime(0.0001, t);
    vol.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
    vol.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    osc.connect(vol).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  });
}
