import { connection } from "next/server";
import { entradaAbierta, entradaConfigurada, tieneAccesoEntrada } from "@/lib/entrada";
import { AppEntrada } from "../AppEntrada";
import { cargarPases } from "../datos";
import { FormPin } from "../FormPin";
import { SinConfigurar } from "../SinConfigurar";

/** Enlace del QR: si se escanea con la cámara normal del teléfono, abre la app con la ficha de esa familia. */
export default async function Pase({ params }: PageProps<"/entrada/[codigo]">) {
  const { codigo } = await params;
  await connection();
  if (!entradaConfigurada()) return <SinConfigurar />;
  if (!(await tieneAccesoEntrada())) return <FormPin volver={`/entrada/${codigo}`} />;

  return <AppEntrada pases={await cargarPases()} inicial={codigo.toLowerCase()} puedeSalir={!entradaAbierta()} />;
}
