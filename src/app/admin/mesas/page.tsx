import { exigirAdmin } from "@/lib/admin";
import { listarFamilias } from "@/lib/familias";
import { listarAsientos, listarMesas } from "@/lib/mesas";
import { MarcoPanel } from "../MarcoPanel";
import { OrganizadorMesas } from "./OrganizadorMesas";

export default async function Mesas() {
  const admin = await exigirAdmin();
  const [familias, mesas, asientos] = await Promise.all([listarFamilias(), listarMesas(), listarAsientos()]);

  return (
    <MarcoPanel activo="mesas" email={admin.email}>
      <OrganizadorMesas
        familias={familias.map(({ id, nombre, invitados, asistencia, asistentes }) => ({
          id,
          nombre,
          invitados,
          asistencia,
          asistentes,
        }))}
        mesas={mesas}
        asientos={asientos}
      />
    </MarcoPanel>
  );
}
