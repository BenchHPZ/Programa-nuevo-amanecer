-- ─────────────────────────────────────────────────────────────────────────
--  Row Level Security — aplicado en la base de datos, no solo en la
--  interfaz (RNF-10). Un usuario 'pendiente' no ve ningún dato (RN-10).
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.esta_activo()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from usuario_perfil where id = auth.uid() and estado = 'activo'
  );
$$;

create or replace function public.puede_escribir()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.tiene_rol(array['capturista', 'administrativo']::public.rol_usuario[]);
$$;

-- ── jornada: lectura para cualquier usuario activo, escritura solo admin ──
alter table public.jornada enable row level security;

create policy "activos_leen_jornada" on public.jornada for select
  using (public.esta_activo());
create policy "admin_escribe_jornada" on public.jornada for insert
  with check (public.es_administrativo());
create policy "admin_actualiza_jornada" on public.jornada for update
  using (public.es_administrativo()) with check (public.es_administrativo());

revoke delete on public.jornada from authenticated, anon;
grant select, insert, update on public.jornada to authenticated;

-- ── persona ────────────────────────────────────────────────────────────
alter table public.persona enable row level security;

create policy "activos_leen_persona" on public.persona for select
  using (public.esta_activo());
create policy "capturistas_crean_persona" on public.persona for insert
  with check (public.puede_escribir());
create policy "capturistas_actualizan_persona" on public.persona for update
  using (public.puede_escribir()) with check (public.puede_escribir());

revoke delete on public.persona from authenticated, anon;
grant select, insert, update on public.persona to authenticated;

-- ── paciente_responsable ──────────────────────────────────────────────────
alter table public.paciente_responsable enable row level security;

create policy "activos_leen_relacion" on public.paciente_responsable for select
  using (public.esta_activo());
create policy "capturistas_crean_relacion" on public.paciente_responsable for insert
  with check (public.puede_escribir());
create policy "capturistas_actualizan_relacion" on public.paciente_responsable for update
  using (public.puede_escribir()) with check (public.puede_escribir());

revoke delete on public.paciente_responsable from authenticated, anon;
grant select, insert, update on public.paciente_responsable to authenticated;

-- ── expediente ─────────────────────────────────────────────────────────
alter table public.expediente enable row level security;

create policy "activos_leen_expediente" on public.expediente for select
  using (public.esta_activo());
create policy "capturistas_crean_expediente" on public.expediente for insert
  with check (public.puede_escribir());
create policy "capturistas_actualizan_expediente" on public.expediente for update
  using (public.puede_escribir()) with check (public.puede_escribir());

revoke delete on public.expediente from authenticated, anon;
grant select, insert, update on public.expediente to authenticated;

-- ── expediente_seccion ─────────────────────────────────────────────────
alter table public.expediente_seccion enable row level security;

create policy "activos_leen_seccion" on public.expediente_seccion for select
  using (public.esta_activo());
create policy "capturistas_crean_seccion" on public.expediente_seccion for insert
  with check (public.puede_escribir());
create policy "capturistas_actualizan_seccion" on public.expediente_seccion for update
  using (public.puede_escribir()) with check (public.puede_escribir());

revoke delete on public.expediente_seccion from authenticated, anon;
grant select, insert, update on public.expediente_seccion to authenticated;

-- ── dictamen_etapa1: solo médico de triage y administrativo ──────────────
alter table public.dictamen_etapa1 enable row level security;

create policy "activos_leen_dictamen" on public.dictamen_etapa1 for select
  using (public.esta_activo());
create policy "medicos_crean_dictamen" on public.dictamen_etapa1 for insert
  with check (public.tiene_rol(array['medico_triage', 'administrativo']::public.rol_usuario[]));
create policy "medicos_actualizan_dictamen" on public.dictamen_etapa1 for update
  using (public.tiene_rol(array['medico_triage', 'administrativo']::public.rol_usuario[]))
  with check (public.tiene_rol(array['medico_triage', 'administrativo']::public.rol_usuario[]));

revoke delete on public.dictamen_etapa1 from authenticated, anon;
grant select, insert, update on public.dictamen_etapa1 to authenticated;

-- ── folio_contador y folio ────────────────────────────────────────────────
-- La asignación real solo ocurre por la función asignar_folio() (SECURITY
-- DEFINER, siguiente migración). No se otorga INSERT directo sobre folio ni
-- folio_contador: es la única manera de garantizar RF-151 (sin colisiones
-- ni huecos) de forma estructural y no por convención.
alter table public.folio_contador enable row level security;
alter table public.folio enable row level security;

create policy "activos_leen_folio" on public.folio for select
  using (public.esta_activo());
create policy "admin_desactiva_folio" on public.folio for update
  using (public.es_administrativo()) with check (public.es_administrativo());

revoke all on public.folio_contador from authenticated, anon;
revoke delete, insert on public.folio from authenticated, anon;
grant select, update on public.folio to authenticated;

-- ── consentimiento y documento ────────────────────────────────────────────
alter table public.consentimiento enable row level security;
alter table public.documento enable row level security;

create policy "activos_leen_consentimiento" on public.consentimiento for select
  using (public.esta_activo());
create policy "capturistas_crean_consentimiento" on public.consentimiento for insert
  with check (public.puede_escribir());
create policy "capturistas_actualizan_consentimiento" on public.consentimiento for update
  using (public.puede_escribir()) with check (public.puede_escribir());

create policy "activos_leen_documento" on public.documento for select
  using (public.esta_activo());
create policy "capturistas_crean_documento" on public.documento for insert
  with check (public.puede_escribir());

revoke delete on public.consentimiento from authenticated, anon;
revoke delete on public.documento from authenticated, anon;
grant select, insert, update on public.consentimiento to authenticated;
grant select, insert on public.documento to authenticated;

-- ── catalogo_campos: solo administrativo escribe (RF-131) ────────────────
alter table public.catalogo_campos enable row level security;

create policy "activos_leen_catalogo" on public.catalogo_campos for select
  using (public.esta_activo());
create policy "admin_escribe_catalogo" on public.catalogo_campos for insert
  with check (public.es_administrativo());
create policy "admin_actualiza_catalogo" on public.catalogo_campos for update
  using (public.es_administrativo()) with check (public.es_administrativo());

revoke delete on public.catalogo_campos from authenticated, anon;
grant select, insert, update on public.catalogo_campos to authenticated;

-- ── pre_registro: cualquiera (incluso anónimo) puede crear uno ───────────
-- Es la única tabla abierta al público sin sesión: la landing la usa antes
-- de que exista cuenta alguna (RF-180). Solo capturista/admin la consultan
-- y promueven a expediente.
alter table public.pre_registro enable row level security;

create policy "publico_crea_pre_registro" on public.pre_registro for insert
  to anon, authenticated
  with check (true);
create policy "capturistas_leen_pre_registro" on public.pre_registro for select
  using (public.puede_escribir());
create policy "capturistas_actualizan_pre_registro" on public.pre_registro for update
  using (public.puede_escribir()) with check (public.puede_escribir());

revoke delete on public.pre_registro from authenticated, anon;
grant insert on public.pre_registro to anon;
grant select, insert, update on public.pre_registro to authenticated;
