-- ─────────────────────────────────────────────────────────────────────────
--  Registro público de colaboradores.
--
--  Tabla propia y no una columna `tipo` en `pre_registro`: ese buffer es de
--  pacientes, tiene FK a `expediente` y su ciclo de vida es «promover a
--  expediente», que aquí no significa nada. Un cirujano que ofrece su tiempo
--  y una familia que busca cirugía no comparten ni campos ni destino, y
--  mezclarlos ensuciaría la bandeja del capturista en plena jornada.
-- ─────────────────────────────────────────────────────────────────────────

create type public.tipo_colaborador as enum (
  'medico',                 -- cirujanos, anestesiología, pediatría, otorrino, terapia de lenguaje
  'enfermeria_estudiante',  -- enfermería y servicio social
  'apoyo_general',          -- logística, traslados, alimentos, registro
  'donativo'                -- empresas y donantes: insumos, dinero o servicios
);

create type public.estado_colaborador as enum (
  'nuevo', 'contactado', 'aceptado', 'descartado'
);

create table public.registro_colaborador (
  id        uuid primary key default extensions.uuid_generate_v4(),
  tipo      public.tipo_colaborador not null,
  datos     jsonb not null,
  estado    public.estado_colaborador not null default 'nuevo',
  notas     text,
  creado_en timestamptz not null default now()
);

comment on table public.registro_colaborador is
  'Quien se ofrece a colaborar desde la landing. No crea cuenta de sistema:
   el alta de usuarios sigue siendo auto-registro + aprobación (RF-101).';

create index registro_colaborador_estado_idx
  on public.registro_colaborador (estado, creado_en desc);

-- ── Auditoría ────────────────────────────────────────────────────────────
create trigger auditoria_registro_colaborador
  after insert or update or delete on public.registro_colaborador
  for each row execute function public.registrar_auditoria();

-- ── RLS: espejo de pre_registro ──────────────────────────────────────────
-- Cualquiera puede ofrecerse (sin sesión); solo el administrativo lee la
-- bandeja y le da seguimiento. Nadie borra.
alter table public.registro_colaborador enable row level security;

create policy "publico_se_ofrece" on public.registro_colaborador for insert
  to anon, authenticated
  with check (true);

create policy "admin_lee_colaboradores" on public.registro_colaborador for select
  using (public.es_administrativo());

create policy "admin_actualiza_colaboradores" on public.registro_colaborador for update
  using (public.es_administrativo()) with check (public.es_administrativo());

revoke delete on public.registro_colaborador from authenticated, anon;
grant insert on public.registro_colaborador to anon;
grant select, insert, update on public.registro_colaborador to authenticated;

-- El chequeo antiabuso corre con el cliente de service_role, que omite RLS
-- pero NO tiene privilegios de tabla por omisión. Sin este grant la consulta
-- falla con "permission denied", el conteo vuelve nulo y el límite deja de
-- aplicarse sin que nada lo delate — que es exactamente lo que pasó con
-- pre_registro (migración 20260802090000).
grant select on public.registro_colaborador to service_role;
