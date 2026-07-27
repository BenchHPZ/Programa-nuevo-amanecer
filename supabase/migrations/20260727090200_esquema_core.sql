-- ─────────────────────────────────────────────────────────────────────────
--  Esquema core — jornada, persona, expediente y derivados
--  Ver docs/MODELO-DATOS.md para la justificación de cada decisión.
-- ─────────────────────────────────────────────────────────────────────────

-- ── Enumeraciones ───────────────────────────────────────────────────────
create type public.estado_jornada as enum ('planeada', 'etapa1', 'etapa2', 'cerrada');
create type public.servicio_tipo as enum ('cirugia', 'laser');
create type public.estado_expediente as enum ('borrador', 'completo', 'dictaminado');
create type public.resultado_dictamen as enum (
  'apto_cirugia', 'apto_laser', 'no_apto', 'regresar_6_meses'
);
create type public.tipo_seccion as enum ('antecedentes', 'socioeconomico');
create type public.tipo_consentimiento as enum (
  'aviso_privacidad', 'deslinde', 'uso_imagen', 'consentimiento_informado'
);
create type public.tipo_documento as enum (
  'acta', 'curp', 'ine_responsable', 'comprobante_domicilio', 'estudio_previo'
);
create type public.estado_pre_registro as enum ('nuevo', 'validado', 'descartado');

-- ── Función auxiliar: unaccent inmutable ────────────────────────────────
-- unaccent() es STABLE por defecto; se necesita IMMUTABLE para usarla en
-- una columna generada (nombre_normalizado, más abajo).
create or replace function public.sin_acentos(p_texto text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, p_texto);
$$;

-- ── jornada ──────────────────────────────────────────────────────────────
create table public.jornada (
  id                 uuid primary key default extensions.uuid_generate_v4(),
  clave              text not null unique,          -- p.ej. '2026B'
  nombre             text not null,
  sede               text not null,
  fecha_inicio_etapa1 date not null,
  fecha_fin_etapa1   date not null,
  fecha_etapa2       date,
  estado             public.estado_jornada not null default 'planeada',
  creado_en          timestamptz not null default now()
);

comment on table public.jornada is 'Edición de la campaña (RN-11): dos por año, duración variable.';

-- ── persona ──────────────────────────────────────────────────────────────
-- Identidad única para pacientes Y responsables (RN-01). Ver MODELO-DATOS §1.1.
create table public.persona (
  id                  uuid primary key default extensions.uuid_generate_v4(),
  curp                text unique,
  nombre              text not null,
  apellido_paterno    text not null,
  apellido_materno    text,
  fecha_nacimiento    date not null,
  sexo                text not null check (sexo in ('H', 'M')),
  telefono            text,
  telefono_alterno    text,
  estado_geografico   text,                          -- estado de la república
  municipio           text,
  localidad           text,
  direccion           text,
  nombre_normalizado  text generated always as (
    public.sin_acentos(lower(
      nombre || ' ' || apellido_paterno || ' ' || coalesce(apellido_materno, '')
    ))
  ) stored,
  activo              boolean not null default true,
  creado_por          uuid references public.usuario_perfil (id),
  creado_en           timestamptz not null default now()
);

comment on table public.persona is
  'Identidad única (RN-01). Un adulto responsable de hoy puede ser paciente
   mañana: no se separa en dos tablas (MODELO-DATOS §1.1).';

create index persona_nombre_trgm_idx
  on public.persona using gin (nombre_normalizado extensions.gin_trgm_ops);
create index persona_telefono_idx on public.persona (telefono);
create index persona_nacimiento_sexo_idx on public.persona (fecha_nacimiento, sexo);

-- ── paciente_responsable ────────────────────────────────────────────────
-- id propio (en vez de PK compuesta) para que el trigger genérico de
-- auditoría, que asume NEW.id / OLD.id, funcione igual en todas las tablas.
create table public.paciente_responsable (
  id              uuid primary key default extensions.uuid_generate_v4(),
  paciente_id     uuid not null references public.persona (id),
  responsable_id  uuid not null references public.persona (id),
  parentesco      text not null,
  es_principal    boolean not null default true,
  creado_en       timestamptz not null default now(),
  constraint responsable_distinto_de_paciente check (paciente_id <> responsable_id),
  unique (paciente_id, responsable_id)
);

comment on table public.paciente_responsable is
  'Todo paciente debe tener al menos un adulto responsable (RN-03), aunque
   el paciente sea mayor de edad.';

-- ── expediente ───────────────────────────────────────────────────────────
-- Un expediente por paciente por jornada (RN-02).
create table public.expediente (
  id           uuid primary key default extensions.uuid_generate_v4(),
  paciente_id  uuid not null references public.persona (id),
  jornada_id   uuid not null references public.jornada (id),
  estado       public.estado_expediente not null default 'borrador',
  activo       boolean not null default true,
  creado_por   uuid references public.usuario_perfil (id),
  creado_en    timestamptz not null default now()
);

comment on table public.expediente is
  'Un expediente por paciente por jornada (RN-02). Permite responder qué se
   dictaminó hace 6 meses sin sobrescribir nada.';

create unique index expediente_paciente_jornada_unico
  on public.expediente (paciente_id, jornada_id)
  where activo;

create index expediente_jornada_estado_idx on public.expediente (jornada_id, estado);
create index expediente_paciente_idx on public.expediente (paciente_id);

-- ── expediente_seccion ───────────────────────────────────────────────────
-- Contenido variable definido por catálogo (RF-130). Ver MODELO-DATOS §1.3.
-- id propio por la misma razón que paciente_responsable (ver arriba).
create table public.expediente_seccion (
  id             uuid primary key default extensions.uuid_generate_v4(),
  expediente_id  uuid not null references public.expediente (id),
  seccion        public.tipo_seccion not null,
  datos          jsonb not null default '{}'::jsonb,
  completa       boolean not null default false,
  actualizado_en timestamptz not null default now(),
  unique (expediente_id, seccion)
);

-- ── dictamen_etapa1 ──────────────────────────────────────────────────────
-- Tabla aparte: la llena otro rol, dispara el folio, requiere evidencia de
-- autoría (MODELO-DATOS §1.4).
create table public.dictamen_etapa1 (
  id                 uuid primary key default extensions.uuid_generate_v4(),
  expediente_id      uuid not null unique references public.expediente (id),
  medico_id          uuid not null references public.usuario_perfil (id),
  resultado          public.resultado_dictamen not null,
  observaciones      text,
  recomendacion      text,               -- RF-142: canalización cuando no_apto
  firma_archivo_path text,
  fecha              timestamptz not null default now()
);

comment on table public.dictamen_etapa1 is
  'Cuatro salidas posibles (RN-12). El resultado apto dispara la asignación
   de folio (RF-144) desde la aplicación tras registrar el dictamen.';

-- ── folio_contador + folio ───────────────────────────────────────────────
-- Contador atómico por jornada y servicio: la asignación real ocurre en la
-- función asignar_folio() (siguiente migración), nunca por INSERT directo.
create table public.folio_contador (
  jornada_id uuid not null references public.jornada (id),
  servicio   public.servicio_tipo not null,
  ultimo     integer not null default 0,
  primary key (jornada_id, servicio)
);

create table public.folio (
  id                 uuid primary key default extensions.uuid_generate_v4(),
  expediente_id      uuid not null references public.expediente (id),
  jornada_id         uuid not null references public.jornada (id),
  servicio           public.servicio_tipo not null,
  consecutivo        integer not null,
  folio_texto        text not null unique,
  digito_verificador integer not null,
  activo             boolean not null default true,
  creado_en          timestamptz not null default now(),
  unique (jornada_id, servicio, consecutivo)
);

comment on table public.folio is
  'Único e irrepetible por jornada y servicio (RN-06). Formato:
   NA-{jornada}-{C|L}-{consecutivo}. Ver función asignar_folio().';

create index folio_expediente_idx on public.folio (expediente_id);

-- ── consentimiento y documento ───────────────────────────────────────────
create table public.consentimiento (
  id             uuid primary key default extensions.uuid_generate_v4(),
  expediente_id  uuid not null references public.expediente (id),
  tipo           public.tipo_consentimiento not null,
  archivo_path   text not null,
  firmado_en     date,
  capturado_por  uuid references public.usuario_perfil (id),
  creado_en      timestamptz not null default now(),
  unique (expediente_id, tipo)
);

comment on table public.consentimiento is
  'Los 4 documentos: aviso de privacidad, deslinde, uso de imagen (Etapa 1) y
   consentimiento informado con 2 testigos, exigido por NOM-004 §10.1 (Etapa 2).';

create table public.documento (
  id             uuid primary key default extensions.uuid_generate_v4(),
  expediente_id  uuid not null references public.expediente (id),
  tipo           public.tipo_documento not null,
  archivo_path   text not null,
  subido_por     uuid references public.usuario_perfil (id),
  creado_en      timestamptz not null default now()
);

-- ── catalogo_campos ──────────────────────────────────────────────────────
-- Define las secciones clínicas por jornada, versionado (RF-131, RF-132).
create table public.catalogo_campos (
  id          uuid primary key default extensions.uuid_generate_v4(),
  jornada_id  uuid not null references public.jornada (id),
  seccion     public.tipo_seccion not null,
  definicion  jsonb not null,
  version     integer not null default 1,
  vigente     boolean not null default true,
  creado_en   timestamptz not null default now()
);

create unique index catalogo_campos_vigente_unico
  on public.catalogo_campos (jornada_id, seccion)
  where vigente;

-- ── pre_registro ─────────────────────────────────────────────────────────
-- Buffer público: NO crea expediente hasta que un capturista lo valida y
-- promueve (RF-181).
create table public.pre_registro (
  id            uuid primary key default extensions.uuid_generate_v4(),
  datos         jsonb not null,
  estado        public.estado_pre_registro not null default 'nuevo',
  expediente_id uuid references public.expediente (id),
  creado_en     timestamptz not null default now()
);
