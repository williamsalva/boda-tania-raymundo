import { LogOut } from "lucide-react";
import { entradaAbierta } from "@/lib/entrada";
import { salirEntrada } from "./acciones";

export function Encabezado({ llegaron, esperados }: { llegaron: number; esperados: number }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div>
        <p className="font-semibold">Entrada · Tania & Raymundo</p>
        <p className="text-zinc-500">
          Han llegado <span className="num font-medium text-zinc-900">{llegaron}</span> de{" "}
          <span className="num font-medium text-zinc-900">{esperados}</span> confirmados
        </p>
      </div>
      {!entradaAbierta() && (
        <form action={salirEntrada}>
          <button title="Salir" className="grid size-9 cursor-pointer place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">
            <LogOut className="size-4" />
          </button>
        </form>
      )}
    </header>
  );
}
