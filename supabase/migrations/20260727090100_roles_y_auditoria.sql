-- ─────────────────────────────────────────────────────────────────────────
--  Usuarios, roles y auditoría
--
--  Sostiene RN-10, RNF-01, RNF-02, RNF-10 y el requisito de la NOM-024 de
--  que el sistema de seguridad de la información arranque su "reloj de
--  madurez" desde que estos controles entran en operación (docs/PLAN.md §4.2).
-- ─────────────────────────────────────────────────────────────────────────

-- ── Roles ───────────────────────────────────────────────────────────────
-- Se agregan como valores del enum, no como refactor de tabla, para que los
-- cuatro roles de Etapa 2 se sumen sin tocar lo ya construido.
create type public.rol_usuario as enum (
  'capturista',
  'informista',
  'administrativo',
  'medico_triage',
  -- Etapa 2
  'primer_contacto',
  'autorizador',
  'evaluador_prequirurgico',
  'programador'
);

create type public.estado_usuario as enum ('pendiente', 'activo', 'suspendido');

-- ── Perfil de usuario ───────────────────────────────────────────────────
-- Un usuario nuevo entra SIEMPRE en 'pendiente', sin rol (RF-101, RN-10).
-- Solo un administrativo lo aprueba y le asigna rol (RF-102).
create table public.usuario_perfil (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null,
  rol         public.rol_usuario,
  estado      public.estado_usuario not null default 'pendiente',
  aprobado_por uuid references public.usuario_perfil (id),
  aprobado_en timestamptz,
  creado_en   timestamptz not null default now(),
  constraint rol_requerido_si_activo
    check (estado <> 'activo' or rol is not null)
);

comment on table public.usuario_perfil is
  'Perfil y rol de cada usuario. Estado pendiente = sin acceso a ningún dato (RN-10).';

-- Alta automática al registrarse (auto-registro, RF-101).
create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuario_perfil (id, nombre, estado)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', new.email), 'pendiente');
  return new;
end;
$$;

create trigger al_registrarse_usuario
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

-- ── Funciones auxiliares para RLS ───────────────────────────────────────
-- SECURITY DEFINER: evita recursión de RLS al consultar usuario_perfil
-- desde dentro de sus propias políticas.

create or replace function public.rol_actual()
returns public.rol_usuario
language sql
security definer
stable
set search_path = public
as $$
  select rol from usuario_perfil
  where id = auth.uid() and estado = 'activo';
$$;

create or replace function public.tiene_rol(roles public.rol_usuario[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from usuario_perfil
    where id = auth.uid() and estado = 'activo' and rol = any(roles)
  );
$$;

create or replace function public.es_administrativo()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.tiene_rol(array['administrativo']::public.rol_usuario[]);
$$;

-- ── RLS de usuario_perfil ───────────────────────────────────────────────
alter table public.usuario_perfil enable row level security;

create policy "cada_quien_ve_su_propio_perfil"
  on public.usuario_perfil for select
  using (id = auth.uid() or public.es_administrativo());

-- Solo un administrativo aprueba, asigna rol o suspende (RF-102, RF-103).
-- Nadie puede auto-aprobarse: la condición exige es_administrativo(), que
-- requiere ya estar activo con ese rol.
create policy "solo_administrativo_modifica_perfiles"
  on public.usuario_perfil for update
  using (public.es_administrativo())
  with check (public.es_administrativo());

revoke delete on public.usuario_perfil from authenticated, anon;

grant select, update on public.usuario_perfil to authenticated;

-- ── Auditoría (RNF-01) ──────────────────────────────────────────────────
-- Append-only. Se llena por trigger genérico, nunca desde la aplicación:
-- imposible de olvidar, imposible de saltar.
create table public.audit_log (
  id            bigint generated always as identity primary key,
  tabla         text not null,
  registro_id   uuid not null,
  accion        text not null check (accion in ('INSERT', 'UPDATE', 'DELETE')),
  usuario_id    uuid,
  ts            timestamptz not null default now(),
  datos_antes   jsonb,
  datos_despues jsonb
);

comment on table public.audit_log is
  'Bitácora append-only. RNF-01, NOM-004 (registros de auditoría), arranque del
   reloj de madurez de seguridad para la certificación SIRES (NOM-024).';

create index audit_log_tabla_registro_idx
  on public.audit_log (tabla, registro_id, ts desc);

alter table public.audit_log enable row level security;

create policy "informistas_y_admin_leen_auditoria"
  on public.audit_log for select
  using (public.tiene_rol(array['informista', 'administrativo']::public.rol_usuario[]));

-- Nadie escribe audit_log directamente: solo el trigger, vía SECURITY DEFINER.
revoke insert, update, delete on public.audit_log from authenticated, anon;
grant select on public.audit_log to authenticated;

create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if (TG_OP = 'DELETE') then
    v_id := old.id;
  else
    v_id := new.id;
  end if;

  insert into public.audit_log (tabla, registro_id, accion, usuario_id, datos_antes, datos_despues)
  values (
    TG_TABLE_NAME,
    v_id,
    TG_OP,
    auth.uid(),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if (TG_OP = 'DELETE') then
    return old;
  else
    return new;
  end if;
end;
$$;

comment on function public.registrar_auditoria is
  'Trigger genérico de auditoría. Adjuntar con AFTER INSERT OR UPDATE OR DELETE
   a cada tabla que deba trazarse. No se depende de que la aplicación la invoque.';
