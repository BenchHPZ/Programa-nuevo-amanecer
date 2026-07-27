-- ─────────────────────────────────────────────────────────────────────────
--  Funciones de negocio: asignación de folio y deduplicación de personas.
-- ─────────────────────────────────────────────────────────────────────────

-- ── Dígito verificador (RF-152) ───────────────────────────────────────────
-- Detecta errores de tecleo al capturar el folio a mano; no es un requisito
-- legal, es control operativo.
create or replace function public.calcular_digito_verificador(p_texto text)
returns integer
language sql
immutable
as $$
  select (
    select coalesce(sum(i * ascii(substr(p_texto, i, 1))), 0)
    from generate_series(1, length(p_texto)) as i
  ) % 10;
$$;

-- ── Asignación transaccional de folio (RF-150, RF-151) ────────────────────
-- Única vía para crear un folio: la tabla folio no acepta INSERT directo
-- (ver migración de RLS). El incremento atómico vive en folio_contador vía
-- UPSERT, que en PostgreSQL toma un row lock — sin colisiones ni huecos con
-- varios capturistas trabajando a la vez.
create or replace function public.asignar_folio(
  p_expediente_id uuid,
  p_servicio public.servicio_tipo
)
returns public.folio
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jornada_id    uuid;
  v_jornada_clave text;
  v_consecutivo   integer;
  v_letra         text;
  v_folio_texto   text;
  v_digito        integer;
  v_folio         public.folio;
begin
  if not public.puede_escribir() then
    raise exception 'No autorizado para asignar folio';
  end if;

  select jornada_id into v_jornada_id
  from public.expediente
  where id = p_expediente_id and activo;

  if v_jornada_id is null then
    raise exception 'Expediente % no existe o está inactivo', p_expediente_id;
  end if;

  if exists (select 1 from public.folio where expediente_id = p_expediente_id and activo) then
    raise exception 'El expediente % ya tiene folio asignado', p_expediente_id;
  end if;

  select clave into v_jornada_clave from public.jornada where id = v_jornada_id;

  insert into public.folio_contador (jornada_id, servicio, ultimo)
  values (v_jornada_id, p_servicio, 1)
  on conflict (jornada_id, servicio)
  do update set ultimo = public.folio_contador.ultimo + 1
  returning ultimo into v_consecutivo;

  v_letra := case p_servicio when 'cirugia' then 'C' when 'laser' then 'L' end;
  v_folio_texto := 'NA-' || v_jornada_clave || '-' || v_letra || '-' || lpad(v_consecutivo::text, 4, '0');
  v_digito := public.calcular_digito_verificador(v_folio_texto);

  insert into public.folio (
    expediente_id, jornada_id, servicio, consecutivo, folio_texto, digito_verificador
  )
  values (
    p_expediente_id, v_jornada_id, p_servicio, v_consecutivo, v_folio_texto, v_digito
  )
  returning * into v_folio;

  return v_folio;
end;
$$;

revoke execute on function public.asignar_folio(uuid, public.servicio_tipo) from public;
grant execute on function public.asignar_folio(uuid, public.servicio_tipo) to authenticated;

-- ── Deduplicación (RF-110, RF-111) ────────────────────────────────────────
-- Cascada: CURP exacta → nombre difuso + fecha de nacimiento + sexo →
-- teléfono. SECURITY INVOKER (no DEFINER): respeta el RLS de persona, así
-- que un usuario 'pendiente' sigue sin ver nada (RN-10).
create or replace function public.buscar_persona_similar(
  p_curp             text default null,
  p_nombre           text default null,
  p_apellido_paterno text default null,
  p_apellido_materno text default null,
  p_fecha_nacimiento date default null,
  p_sexo             text default null,
  p_telefono         text default null
)
returns table (
  id                uuid,
  curp              text,
  nombre            text,
  apellido_paterno  text,
  apellido_materno  text,
  fecha_nacimiento  date,
  sexo              text,
  telefono          text,
  similitud         real,
  motivo            text
)
language sql
stable
set search_path = public, extensions
as $$
  with nombre_buscado as (
    select public.sin_acentos(lower(
      coalesce(p_nombre, '') || ' ' ||
      coalesce(p_apellido_paterno, '') || ' ' ||
      coalesce(p_apellido_materno, '')
    )) as texto
  )
  select p.id, p.curp, p.nombre, p.apellido_paterno, p.apellido_materno,
         p.fecha_nacimiento, p.sexo, p.telefono,
         1.0::real as similitud, 'curp'::text as motivo
  from public.persona p
  where p_curp is not null and p.curp = p_curp and p.activo

  union all

  select p.id, p.curp, p.nombre, p.apellido_paterno, p.apellido_materno,
         p.fecha_nacimiento, p.sexo, p.telefono,
         extensions.similarity(p.nombre_normalizado, nb.texto) as similitud,
         'nombre_fecha'::text as motivo
  from public.persona p, nombre_buscado nb
  where p_nombre is not null
    and p_fecha_nacimiento is not null
    and p.fecha_nacimiento = p_fecha_nacimiento
    and (p_sexo is null or p.sexo = p_sexo)
    and p.activo
    and extensions.similarity(p.nombre_normalizado, nb.texto) > 0.3

  union all

  select p.id, p.curp, p.nombre, p.apellido_paterno, p.apellido_materno,
         p.fecha_nacimiento, p.sexo, p.telefono,
         0.5::real as similitud, 'telefono'::text as motivo
  from public.persona p
  where p_telefono is not null and p.telefono = p_telefono and p.activo

  order by similitud desc
  limit 15;
$$;

revoke execute on function public.buscar_persona_similar from public;
grant execute on function public.buscar_persona_similar to authenticated;
