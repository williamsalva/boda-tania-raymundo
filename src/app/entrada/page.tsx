import { connection } from "next/server";
import { entradaConfigurada, tieneAccesoEntrada } from "@/lib/entrada";
import { listarFamilias } from "@/lib/familias";
import { esperadosDe } from "@/lib/pases";
import { Buscador } from "./Buscador";
import { Encabezado } from "./Encabezado";
import { Escaner } from "./Escaner";
import { FormPin } from "./FormPin";
import { SinConfigurar } from "./SinConfigurar";

export default async function Entrada() {
  // Siempre al momento: depende del PIN, la cookie y las llegadas.
  await connection();
  if (!entradaConfigurada()) return <SinConfigurar />;
  if (!(await tieneAccesoEntrada())) return <FormPin volver="/entrada" />;

  const familias = await listarFamilias();
  const confirmadas = familias.filter((f) => f.asistencia === "si");
  const esperados = confirmadas.reduce((s, f) => s + (f.asistentes?.length ?? 0), 0);
  const llegaron = familias.reduce((s, f) => s + f.llegaron.length, 0);

  return (
    <>
      <Encabezado llegaron={llegaron} esperados={esperados} />
      <div className="mt-5">
        <Escaner />
      </div>
      <p className="mt-3 text-center text-zinc-500">Apunta la cámara al QR del pase.</p>
      <Buscador
        familias={familias.map((f) => ({
          codigo: f.codigo,
          nombre: f.nombre,
          invitados: f.invitados,
          esperados: esperadosDe(f).length,
          llegaron: f.llegaron.length,
        }))}
      />
    </>
  );
}
