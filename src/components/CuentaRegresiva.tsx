"use client";

import { useEffect, useState } from "react";

function restante(objetivo: number) {
  const ms = Math.max(0, objetivo - Date.now());
  return {
    Días: Math.floor(ms / 86_400_000),
    Horas: Math.floor(ms / 3_600_000) % 24,
    Minutos: Math.floor(ms / 60_000) % 60,
    Segundos: Math.floor(ms / 1000) % 60,
  };
}

export function CuentaRegresiva({ fecha }: { fecha: string }) {
  const objetivo = new Date(fecha).getTime();
  const [tiempo, setTiempo] = useState<ReturnType<typeof restante> | null>(null);

  useEffect(() => {
    const tick = () => setTiempo(restante(objetivo));
    const primero = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(primero);
      clearInterval(id);
    };
  }, [objetivo]);

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-6 max-w-lg mx-auto" aria-live="off">
      {Object.entries(tiempo ?? { Días: 0, Horas: 0, Minutos: 0, Segundos: 0 }).map(
        ([unidad, valor]) => (
          <div key={unidad} className="flex flex-col items-center">
            <span className="font-serif text-4xl sm:text-6xl font-light tabular-nums text-white">
              {tiempo ? String(valor).padStart(2, "0") : "--"}
            </span>
            <span className="etiqueta !text-[0.6rem] sm:!text-[0.65rem] text-white/80 mt-2">
              {unidad}
            </span>
          </div>
        ),
      )}
    </div>
  );
}
