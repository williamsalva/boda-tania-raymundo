import { connection } from "next/server";
import { entradaAbierta, entradaConfigurada, tieneAccesoEntrada } from "@/lib/entrada";
import { AppEntrada } from "./AppEntrada";
import { cargarPases } from "./datos";
import { FormPin } from "./FormPin";
import { SinConfigurar } from "./SinConfigurar";

export default async function Entrada() {
  // Siempre al momento: depende del PIN, la cookie y las llegadas.
  await connection();
  if (!entradaConfigurada()) return <SinConfigurar />;
  if (!(await tieneAccesoEntrada())) return <FormPin volver="/entrada" />;

  return <AppEntrada pases={await cargarPases()} puedeSalir={!entradaAbierta()} />;
}
