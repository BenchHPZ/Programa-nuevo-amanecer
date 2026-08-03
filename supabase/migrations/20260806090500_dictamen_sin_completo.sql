-- ─────────────────────────────────────────────────────────────────────────
--  El dictamen ya no espera a que Historia clínica y Datos socioeconómicos
--  estén completos: se puede registrar en cuanto el expediente existe, que
--  ya exige paciente + responsable vinculados (crearExpedienteConResponsable,
--  app/captura/nuevo/asistente.tsx). `completo` sigue existiendo como
--  semáforo informativo de cuánta captura falta (RF-124, guardarSeccion),
--  pero deja de ser requisito para dictaminar. Lo único que sigue bloqueado
--  es un expediente que ya tiene dictamen — dictamen_etapa1.expediente_id
--  ya es `unique`, así que un doble dictamen era imposible de todas formas;
--  este chequeo solo da un mensaje claro en vez del error crudo de la
--  constraint.
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
