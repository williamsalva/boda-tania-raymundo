import { CalendarHeart, CircleCheck, CircleX, Clock3, Download, ExternalLink, LogOut, Users } from "lucide-react";
import type { ReactNode } from "react";
import { exigirAdmin, modoDemoAdmin } from "@/lib/admin";
import { FECHA_BODA } from "@/lib/boda";
import { listarFamilias, type Familia } from "@/lib/familias";
import { cerrarSesion } from "./acciones";
import { PanelFamilias } from "./PanelFamilias";
import { Logo } from "./Logo";

function resumen(familias: Familia[]) {
  let invitados = 0, confirmados = 0, noAsisten = 0, pendientes = 0, respondieron = 0;
  for (const f of familias) {
    invitados += f.invitados.length;
    if (f.asistencia === "pendiente") {
      pendientes += f.invitados.length;
    } else {
      respondieron++;
      const van = f.asistentes?.length ?? 0;
      confirmados += van;
      noAsisten += f.invitados.length - van;
    }
  }
  return { familias: familias.length, invitados, confirmados, noAsisten, pendientes, respondieron };
}

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

function Kpi({
  titulo,
  valor,
  detalle,
  icono,
  tono,
  barra,
}: {
  titulo: string;
  valor: number;
  detalle: string;
  icono: ReactNode;
  tono: string;
  barra?: { valor: number; color: string };
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <p className="text-[0.8rem] font-medium text-zinc-500">{titulo}</p>
        <span className={`grid size-8 place-items-center rounded-lg ${tono}`}>{icono}</span>
      </div>
      <p className="num mt-3 text-3xl font-semibold text-zinc-900">{valor}</p>
      <p className="mt-1 text-[0.8rem] text-zinc-500">{detalle}</p>
      {barra && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
          <div className={`h-full rounded-full ${barra.color}`} style={{ width: `${barra.valor}%` }} />
        </div>
      )}
    </div>
  );
}

/** Dona con la distribución de personas por estado. */
function Dona({ partes }: { partes: { valor: number; color: string }[] }) {
  const total = partes.reduce((s, p) => s + p.valor, 0) || 1;
  const C = 2 * Math.PI * 42;
  // Cada tramo empieza donde terminó el anterior.
  const tramos = partes.map((p, i) => ({
    ...p,
    largo: (p.valor / total) * C,
    inicio: partes.slice(0, i).reduce((s, q) => s + (q.valor / total) * C, 0),
  }));
  return (
    <svg viewBox="0 0 100 100" className="size-36 -rotate-90">
      <circle cx="50" cy="50" r="42" fill="none" strokeWidth="11" className="stroke-zinc-100" />
      {tramos.map((t, i) => (
        <circle
          key={i}
          cx="50"
          cy="50"
          r="42"
          fill="none"
          strokeWidth="11"
          className={t.color}
          strokeDasharray={`${Math.max(0, t.largo - (t.valor ? 1.2 : 0))} ${C}`}
          strokeDashoffset={-t.inicio}
        />
      ))}
    </svg>
  );
}

function diasPara(fecha: string) {
  return Math.max(0, Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000));
}

function hace(fecha: string) {
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86_400_000);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  return new Date(fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export default async function Panel() {
  const admin = await exigirAdmin();
  const familias = await listarFamilias();
  const r = resumen(familias);
  const diasBoda = diasPara(FECHA_BODA);
  const recientes = familias
    .filter((f) => f.confirmado_at)
    .sort((a, b) => b.confirmado_at!.localeCompare(a.confirmado_at!))
    .slice(0, 5);

  return (
    <div className="lg:grid lg:grid-cols-[248px_1fr]">
      {/* Barra lateral */}
      <aside className="sticky top-0 hidden h-[100svh] flex-col border-r border-zinc-200 bg-white px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <Logo className="size-9" />
          <div className="leading-tight">
            <p className="font-semibold text-zinc-900">Tania & Raymundo</p>
            <p className="text-xs text-zinc-500">11 dic 2026 · Guadalajara</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1">
          <a href="#familias" className="flex items-center gap-2.5 rounded-lg bg-zinc-100 px-3 py-2 font-medium text-zinc-900">
            <Users className="size-4" /> Invitados
          </a>
          <a href="/" target="_blank" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
            <ExternalLink className="size-4" /> Ver invitación
          </a>
          <a href="/admin/exportar" download className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
            <Download className="size-4" /> Exportar a Excel
          </a>
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="flex items-center gap-2 text-xs text-zinc-500">
              <CalendarHeart className="size-3.5" /> Cuenta regresiva
            </p>
            <p className="mt-1 text-zinc-900">
              <span className="num text-lg font-semibold">{diasBoda}</span> días para la boda
            </p>
          </div>
          <div className="flex items-center gap-2 border-t border-zinc-200 px-1 pt-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-medium uppercase text-zinc-600">
              {admin.email.slice(0, 2)}
            </span>
            <p className="min-w-0 flex-1 truncate text-xs text-zinc-600">{admin.email}</p>
            {!modoDemoAdmin && (
              <form action={cerrarSesion}>
                <button title="Cerrar sesión" className="grid size-8 cursor-pointer place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
                  <LogOut className="size-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Barra superior en móvil */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo className="size-8" />
          <p className="flex-1 font-semibold">Invitados</p>
          <span className="num rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">{diasBoda} días</span>
          <a href="/admin/exportar" download title="Exportar a Excel" className="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">
            <Download className="size-4" />
          </a>
          {!modoDemoAdmin && (
            <form action={cerrarSesion}>
              <button title="Cerrar sesión" className="grid size-8 cursor-pointer place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">
                <LogOut className="size-4" />
              </button>
            </form>
          )}
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
          {modoDemoAdmin && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-500" />
              <p>
                <strong className="font-semibold">Modo demo.</strong> Supabase no está configurado: el panel usa
                familias de ejemplo en memoria y no pide login. Los cambios se pierden al reiniciar.
              </p>
            </div>
          )}

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Resumen</h1>
            <p className="mt-1 text-zinc-500">Cómo van las confirmaciones de la boda.</p>
          </div>

          <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <Kpi
              titulo="Invitados"
              valor={r.invitados}
              detalle={`En ${r.familias} ${r.familias === 1 ? "familia" : "familias"}`}
              icono={<Users className="size-4" />}
              tono="bg-zinc-100 text-zinc-700"
            />
            <Kpi
              titulo="Confirmados"
              valor={r.confirmados}
              detalle={`${pct(r.confirmados, r.invitados)}% de los invitados`}
              icono={<CircleCheck className="size-4" />}
              tono="bg-emerald-50 text-emerald-600"
              barra={{ valor: pct(r.confirmados, r.invitados), color: "bg-emerald-500" }}
            />
            <Kpi
              titulo="No asistirán"
              valor={r.noAsisten}
              detalle={`${pct(r.noAsisten, r.invitados)}% de los invitados`}
              icono={<CircleX className="size-4" />}
              tono="bg-rose-50 text-rose-600"
              barra={{ valor: pct(r.noAsisten, r.invitados), color: "bg-rose-500" }}
            />
            <Kpi
              titulo="Sin responder"
              valor={r.pendientes}
              detalle={`${r.familias - r.respondieron} familias pendientes`}
              icono={<Clock3 className="size-4" />}
              tono="bg-amber-50 text-amber-600"
              barra={{ valor: pct(r.pendientes, r.invitados), color: "bg-amber-400" }}
            />
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-5">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:col-span-2">
              <p className="font-medium text-zinc-900">Respuestas</p>
              <p className="text-[0.8rem] text-zinc-500">
                {r.respondieron} de {r.familias} familias han respondido
              </p>
              <div className="mt-5 flex items-center gap-6">
                <div className="relative shrink-0">
                  <Dona
                    partes={[
                      { valor: r.confirmados, color: "stroke-emerald-500" },
                      { valor: r.noAsisten, color: "stroke-rose-500" },
                      { valor: r.pendientes, color: "stroke-amber-400" },
                    ]}
                  />
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="num text-2xl font-semibold">{pct(r.confirmados + r.noAsisten, r.invitados)}%</p>
                      <p className="text-[0.7rem] text-zinc-500">respondido</p>
                    </div>
                  </div>
                </div>
                <ul className="flex-1 space-y-3">
                  {(
                    [
                      ["Confirmados", r.confirmados, "bg-emerald-500"],
                      ["No asistirán", r.noAsisten, "bg-rose-500"],
                      ["Sin responder", r.pendientes, "bg-amber-400"],
                    ] as const
                  ).map(([t, v, c]) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <span className={`size-2.5 rounded-full ${c}`} />
                      <span className="flex-1 text-zinc-600">{t}</span>
                      <span className="num font-medium">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:col-span-3">
              <div className="flex items-center justify-between px-5 pt-5">
                <p className="font-medium text-zinc-900">Últimas respuestas</p>
                <span className="text-[0.8rem] text-zinc-500">{r.respondieron} en total</span>
              </div>
              {recientes.length ? (
                <ul className="mt-3 divide-y divide-zinc-100">
                  {recientes.map((f) => {
                    const van = f.asistentes?.length ?? 0;
                    return (
                      <li key={f.id} className="flex items-center gap-3 px-5 py-3">
                        <span
                          className={`grid size-8 shrink-0 place-items-center rounded-full ${
                            van ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {van ? <CircleCheck className="size-4" /> : <CircleX className="size-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-zinc-900">{f.nombre}</p>
                          <p className="truncate text-[0.8rem] text-zinc-500">
                            {van ? `Asistirán ${van} de ${f.invitados.length}` : "No podrán asistir"}
                            {f.mensaje && ` · “${f.mensaje}”`}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-zinc-400">{hace(f.confirmado_at!)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-5 py-10 text-center text-zinc-500">Todavía no hay respuestas.</p>
              )}
            </div>
          </section>

          <PanelFamilias familias={familias} />
        </main>
      </div>
    </div>
  );
}
