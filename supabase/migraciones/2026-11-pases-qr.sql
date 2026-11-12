-- Ejecutar una vez en Supabase → SQL Editor (base ya existente).
-- Agrega el código del pase de entrada (QR) y el registro de llegada por familia.
alter table public.familias add column if not exists codigo uuid not null unique default gen_random_uuid();
alter table public.familias add column if not exists llegaron text[] not null default '{}' check (llegaron <@ invitados);
alter table public.familias add column if not exists llegada_at timestamptz;
