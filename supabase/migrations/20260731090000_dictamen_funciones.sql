-- ─────────────────────────────────────────────────────────────────────────
--  Registro del dictamen del médico (RF-140 a RF-144).
-- ─────────────────────────────────────────────────────────────────────────

-- asignar_folio() solo permitía capturista/administrativo (era la única vía
-- de asignación hasta ahora). RF-144: el resultado "apto" del médico también
-- debe disparar la asignación, así que su rol entra al mismo chequeo.
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
  if not public.tiene_rol(array['capturista', 'administrativo', 'medico_triage']::public.rol_usuario[]) then
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

-- ── registrar_dictamen: todo o nada ───────────────────────────────────────
-- Une tres pasos que deben tener éxito juntos o fallar juntos: registrar el
-- dictamen, transicionar el expediente a 'dictaminado' (RF-141) y, si el
-- resultado es apto, asignar folio (RF-144). Sin esta función, un error a
-- medio camino dejaría un dictamen sin folio o un expediente en estado
-- inconsistente — el cuerpo de la función corre en la transacción del
-- llamador, así que cualquier excepción revierte todo.
create or replace function public.registrar_dictamen(
  p_expediente_id uuid,
  p_resultado public.resultado_dictamen,
  p_observaciones text default null,
  p_recomendacion text default null
)
returns table (dictamen public.dictamen_etapa1, folio public.folio)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado    public.estado_expediente;
  v_dictamen  public.dictamen_etapa1;
  v_folio     public.folio;
  v_servicio  public.servicio_tipo;
begin
  if not public.tiene_rol(array['medico_triage', 'administrativo']::public.rol_usuario[]) then
    raise exception 'No autorizado para registrar dictamen';
  end if;

  select estado into v_estado
  from public.expediente
  where id = p_expediente_id and activo
  for update;

  if v_estado is null then
    raise exception 'Expediente % no existe o está inactivo', p_expediente_id;
  end if;
  if v_estado <> 'completo' then
    raise exception 'El expediente % no está listo para dictamen (estado actual: %)', p_expediente_id, v_estado;
  end if;

  insert into public.dictamen_etapa1 (expediente_id, medico_id, resultado, observaciones, recomendacion)
  values (
    p_expediente_id, auth.uid(), p_resultado, p_observaciones,
    case when p_resultado = 'no_apto' then p_recomendacion else null end
  )
  returning * into v_dictamen;

  update public.expediente set estado = 'dictaminado' where id = p_expediente_id;

  v_servicio := case p_resultado
    when 'apto_cirugia' then 'cirugia'::public.servicio_tipo
    when 'apto_laser' then 'laser'::public.servicio_tipo
    else null
  end;

  if v_servicio is not null then
    v_folio := public.asignar_folio(p_expediente_id, v_servicio);
  end if;

  dictamen := v_dictamen;
  folio := v_folio;
  return next;
end;
$$;

revoke execute on function public.registrar_dictamen(uuid, public.resultado_dictamen, text, text) from public;
grant execute on function public.registrar_dictamen(uuid, public.resultado_dictamen, text, text) to authenticated;
