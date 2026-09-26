-- Ejecutar en Supabase → SQL Editor.

create table if not exists public.familias (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nombre text not null,
  -- Un nombre por persona invitada (un boleto cada uno).
  invitados text[] not null check (cardinality(invitados) > 0),
  boletos int generated always as (cardinality(invitados)) stored,
  asistencia text not null default 'pendiente' check (asistencia in ('pendiente', 'si', 'no')),
  -- Quiénes confirmaron; siempre es un subconjunto de `invitados`.
  asistentes text[] check (asistentes is null or asistentes <@ invitados),
  mensaje text,
  telefono text,
  confirmado_at timestamptz,
  created_at timestamptz not null default now()
);

-- La app accede solo desde el servidor con la service role key.
-- RLS activado sin políticas = nadie con la anon key puede leer ni escribir.
alter table public.familias enable row level security;

-- Resumen rápido para los novios.
create or replace view public.resumen_confirmaciones
with (security_invoker = true) as
select
  count(*)                                                   as familias,
  sum(boletos)                                               as boletos_asignados,
  count(*) filter (where asistencia = 'si')                  as familias_confirmadas,
  count(*) filter (where asistencia = 'no')                  as familias_no_asisten,
  count(*) filter (where asistencia = 'pendiente')           as familias_pendientes,
  coalesce(sum(cardinality(asistentes)), 0)                  as personas_confirmadas
from public.familias;

-- Lista persona por persona.
create or replace view public.invitados_detalle
with (security_invoker = true) as
select
  f.nombre as familia,
  i.invitado,
  case
    when f.asistencia = 'pendiente' then 'pendiente'
    when i.invitado = any (f.asistentes) then 'asistirá'
    else 'no asistirá'
  end as estado
from public.familias f
cross join lateral unnest(f.invitados) as i(invitado)
order by f.nombre, i.invitado;

-- ——— Organizador de mesas ———

create table if not exists public.mesas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  capacidad int not null default 12 check (capacidad between 1 and 50),
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- Un invitado se identifica por su familia y su nombre; cada persona ocupa un solo asiento.
create table if not exists public.asientos (
  familia_id uuid not null references public.familias (id) on delete cascade,
  invitado text not null,
  mesa_id uuid not null references public.mesas (id) on delete cascade,
  primary key (familia_id, invitado)
);
create index if not exists asientos_mesa_idx on public.asientos (mesa_id);

alter table public.mesas enable row level security;
alter table public.asientos enable row level security;

-- Ejemplo de alta (el slug es lo que va en la URL: tudominio.com/familia-alba-garcia)
insert into public.familias (slug, nombre, invitados) values
  ('familia-alba-garcia', 'Familia Alba García', array['María Alba', 'José Alba', 'Ana Alba', 'Luis Alba']),
  ('familia-garcia-leon', 'Familia García León', array['Carmen García', 'Pedro García', 'Sofía García'])
on conflict (slug) do nothing;
