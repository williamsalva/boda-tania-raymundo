"use client";

import { useState } from "react";

export function Copiar({ texto, children }: { texto: string; children: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="relative z-10 inline-block border border-vino/40 px-7 py-3 etiqueta text-vino transition-colors hover:border-vino hover:bg-vino hover:text-white"
    >
      {copiado ? "¡Copiado!" : children}
    </button>
  );
}
