import { connection } from "next/server";
import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { entradaConfigurada, tieneAccesoEntrada } from "@/lib/entrada";
import { obtenerFamiliaPorCodigo } from "@/lib/familias";
import { listarAsientos, listarMesas } from "@/lib/mesas";
import { esperadosDe } from "@/lib/pases";
import { FormPin } from "../FormPin";
import { SinConfigurar } from "../SinConfigurar";
import { FichaLlegada } from "./FichaLlegada";

export default async function Pase({ params }: PageProps<"/entrada/[codigo]">) {
  const { codigo } = await params;
  await connection();
  if (!entradaConfigurada()) return <SinConfigurar />;
  if (!(await tieneAccesoEntrada())) return <FormPin volver={`/entrada/${codigo}`} />;

  const familia = await obtenerFamiliaPorCodigo(codigo);
  if (!familia) {
    return (
      <div className="mt-16 rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-rose-600">
          <SearchX className="size-6" />
        </span>
        <h1 className="mt-4 text-lg font-semibold">Pase no válido</h1>
        <p className="mt-1 text-zinc-500">Este código no corresponde a ninguna invitación. Busca a la familia por nombre.</p>
        <Link href="/entrada" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 font-medium text-white">
          <ArrowLeft className="size-4" /> Volver a escanear
        </Link>
      </div>
    );
  }

  const [mesas, asientos] = await Promise.all([listarMesas(), listarAsientos()]);
  const nombreMesa = new Map(mesas.map((m) => [m.id, m.nombre]));
  const mesaDe = Object.fromEntries(
    asientos
      .filter((a) => a.familia_id === familia.id)
      .map((a) => [a.invitado, nombreMesa.get(a.mesa_id) ?? ""]),
  );

  return (
    <FichaLlegada
      key={familia.id}
      familia={{
        id: familia.id,
        nombre: familia.nombre,
        asistencia: familia.asistencia,
        invitados: familia.invitados,
        esperados: esperadosDe(familia),
        llegaron: familia.llegaron,
        llegadaAt: familia.llegada_at,
        mensaje: familia.mensaje,
      }}
      mesaDe={mesaDe}
    />
  );
}
