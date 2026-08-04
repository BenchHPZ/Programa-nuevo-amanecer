-- ─────────────────────────────────────────────────────────────────────────
--  Catálogo de opciones de dictamen por jornada — mismo patrón versionado
--  que catalogo_campos (20260727090200_esquema_core.sql), pero sin
--  `seccion`: un solo catálogo por jornada, no uno por sección clínica.
--
--  `definicion` = { opciones: [{ resultado, etiqueta, descripcion? }] }.
--  `resultado` debe ser uno de los valores de resultado_dictamen — se
--  valida en la aplicación (app/admin/dictamen-opciones/acciones.ts), igual
--  que catalogo_campos valida sus tipos de campo ahí y no en la base.
--
--  Si una jornada no tiene fila vigente aquí, la aplicación usa las 4
--  salidas originales como default (lib/dictamen.ts) — ninguna jornada ya
--  en curso cambia de comportamiento sin que un administrativo lo pida.
-- ─────────────────────────────────────────────────────────────────────────

create table public.catalogo_dictamen (
  id          uuid primary key default extensions.uuid_generate_v4(),
  jornada_id  uuid not null references public.jornada (id),
  definicion  jsonb not null,
  version     integer not null default 1,
  vigente     boolean not null default true,
  creado_en   timestamptz not null default now()
);

create unique index catalogo_dictamen_vigente_unico
  on public.catalogo_dictamen (jornada_id)
  where vigente;

alter table public.catalogo_dictamen enable row level security;

create policy "activos_leen_catalogo_dictamen" on public.catalogo_dictamen for select
  using (public.esta_activo());
create policy "admin_escribe_catalogo_dictamen" on public.catalogo_dictamen for insert
  with check (public.es_administrativo());
create policy "admin_actualiza_catalogo_dictamen" on public.catalogo_dictamen for update
  using (public.es_administrativo()) with check (public.es_administrativo());

revoke delete on public.catalogo_dictamen from authenticated, anon;
grant select, insert, update on public.catalogo_dictamen to authenticated;
