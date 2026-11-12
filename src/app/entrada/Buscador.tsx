"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export type FamiliaBuscable = {
  codigo: string;
  nombre: string;
  invitados: string[];
  esperados: number;
  llegaron: number;
};

const sinAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Respaldo para cuando alguien no trae su QR: buscar por familia o por nombre de invitado. */
export function Buscador({ familias }: { familias: FamiliaBuscable[] }) {
  const [q, setQ] = useState("");

  const resultados = useMemo(() => {
    const t = sinAcentos(q.trim());
    if (t.length < 2) return [];
    return familias
      .filter((f) => sinAcentos(f.nombre).includes(t) || f.invitados.some((n) => sinAcentos(n).includes(t)))
      .slice(0, 8);
  }, [familias, q]);

  return (
    <div className="mt-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="¿Sin QR? Busca familia o invitado"
          className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-9 pr-3 text-base outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
        />
      </div>
      {q.trim().length >= 2 && (
        <ul className="mt-2 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {resultados.length === 0 && <li className="px-4 py-3 text-zinc-500">Sin resultados.</li>}
          {resultados.map((f) => (
            <li key={f.codigo}>
              <Link href={`/entrada/${f.codigo}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{f.nombre}</p>
                  <p className="truncate text-[0.8rem] text-zinc-500">{f.invitados.join(", ")}</p>
                </div>
                <span
                  className={`num shrink-0 rounded-md px-2 py-0.5 text-[0.8rem] ${
                    f.llegaron ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {f.llegaron}/{f.esperados}
                </span>
                <ChevronRight className="size-4 shrink-0 text-zinc-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
