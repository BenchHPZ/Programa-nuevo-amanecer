-- ─────────────────────────────────────────────────────────────────────────
--  registrar_dictamen() mapea los 6 resultados posibles (4 originales + los
--  2 de esta edición) a (servicio, sede) para asignar_folio(). Misma firma
--  que 20260806090500_dictamen_sin_completo.sql, solo cambia este mapeo.
--  `recomendacion` se queda atada solo a 'no_apto' — sin cambio (RF-142).
-- ─────────────────────────────────────────────────────────────────────────

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
  v_sede      text;
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
  if v_estado = 'dictaminado' then
    raise exception 'El expediente % ya tiene un dictamen registrado', p_expediente_id;
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
    when 'cirugia_guanajuato' then 'cirugia'::public.servicio_tipo
    when 'cirugia_leon' then 'cirugia'::public.servicio_tipo
    when 'apto_laser' then 'laser'::public.servicio_tipo
    else null
  end;

  v_sede := case p_resultado
    when 'cirugia_guanajuato' then 'gto'
    when 'cirugia_leon' then 'leon'
    else 'general'
  end;

  if v_servicio is not null then
    v_folio := public.asignar_folio(p_expediente_id, v_servicio, v_sede);
  end if;

  dictamen := v_dictamen;
  folio := v_folio;
  return next;
end;
$$;
