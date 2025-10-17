-- Aspirantes
create table if not exists public.aspirantes (
  id bigserial primary key,
  created_at timestamp with time zone default now(),
  nombre text not null,
  documento text,
  telefono text,
  edad int,
  experiencia text,
  ingresos numeric
);

-- Vacantes
create table if not exists public.vacantes (
  id bigserial primary key,
  created_at timestamp with time zone default now(),
  cargo text not null,
  empresa text,
  salario numeric,
  descripcion text,
  contacto text
);

-- Arriendos
create table if not exists public.arriendos (
  id bigserial primary key,
  created_at timestamp with time zone default now(),
  ubicacion text not null,
  precio numeric not null,
  tipo text not null,
  contacto text not null,
  notas text
);

-- Seguridad: desactivar RLS por uso interno (puedes activarlo luego)
alter table public.aspirantes disable row level security;
alter table public.vacantes disable row level security;
alter table public.arriendos disable row level security;
