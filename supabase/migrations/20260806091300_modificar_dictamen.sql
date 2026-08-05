-- ─────────────────────────────────────────────────────────────────────────
--  modificar_dictamen(): permite corregir un dictamen ya registrado (a
--  diferencia de registrar_dictamen(), que rechaza si el expediente ya está
--  'dictaminado'). Mismo mapeo resultado → (servicio, sede) que
--  registrar_dictamen(). Si la nueva categoría de folio no coincide con la
--  que ya tiene el expediente, el folio anterior se anula (nunca se borra)
--  y, si la nueva salida también implica folio, se asigna uno nuevo en su
--  propia serie — asignar_folio() rechaza asignar mientras exista un folio
--  activo, por eso el anterior se anula antes, en la misma transacción.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.modificar_dictamen(
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
  v_dictamen_actual public.dictamen_etapa1;
  v_servicio_nuevo  public.servicio_tipo;
  v_sede_nueva      text;
  v_folio_actual    public.folio;
  v_dictamen        public.dictamen_etapa1;
  v_folio           public.folio;
begin
  if not public.tiene_rol(array['medico_triage', 'administrativo']::public.rol_usuario[]) then
    raise exception 'No autorizado para modificar dictamen';
  end if;

  select * into v_dictamen_actual
  from public.dictamen_etapa1
  where expediente_id = p_expediente_id;

  if v_dictamen_actual is null then
    raise exception 'El expediente % no tiene un dictamen que modificar', p_expediente_id;
  end if;

  select * into v_folio_actual
  from public.folio
  where expediente_id = p_expediente_id and activo;

  v_servicio_nuevo := case p_resultado
    when 'apto_cirugia' then 'cirugia'::public.servicio_tipo
    when 'cirugia_guanajuato' then 'cirugia'::public.servicio_tipo
    when 'cirugia_leon' then 'cirugia'::public.servicio_tipo
    when 'apto_laser' then 'laser'::public.servicio_tipo
    else null
  end;

  v_sede_nueva := case p_resultado
    when 'cirugia_guanajuato' then 'gto'
    when 'cirugia_leon' then 'leon'
    else 'general'
  end;

  if v_folio_actual is not null
     and (v_servicio_nuevo is distinct from v_folio_actual.servicio
          or v_sede_nueva is distinct from v_folio_actual.sede) then
    update public.folio set activo = false where id = v_folio_actual.id;
    v_folio_actual := null;
  end if;

  if v_servicio_nuevo is not null and v_folio_actual is null then
    v_folio := public.asignar_folio(p_expediente_id, v_servicio_nuevo, v_sede_nueva);
  else
    v_folio := v_folio_actual;
  end if;

  update public.dictamen_etapa1
  set resultado = p_resultado,
      observaciones = p_observaciones,
      recomendacion = case when p_resultado = 'no_apto' then p_recomendacion else null end,
      modificado_por = auth.uid(),
      modificado_en = now()
  where expediente_id = p_expediente_id
  returning * into v_dictamen;

  dictamen := v_dictamen;
  folio := v_folio;
  return next;
end;
$$;

revoke execute on function public.modificar_dictamen(uuid, public.resultado_dictamen, text, text) from public;
grant execute on function public.modificar_dictamen(uuid, public.resultado_dictamen, text, text) to authenticated;
