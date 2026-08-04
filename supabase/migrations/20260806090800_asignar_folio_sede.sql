-- ─────────────────────────────────────────────────────────────────────────
--  asignar_folio() gana `p_sede`, con default 'general' para no romper a
--  quien ya la llama sin ese argumento. El folio incluye el segmento de
--  sede solo cuando no es la genérica.
--
--  `create or replace function` con una lista de parámetros distinta NO
--  reemplaza la función anterior — Postgres la trata como un overload
--  nuevo, y la firma de 2 argumentos seguiría existiendo (y quedaría
--  desincronizada, sin la lógica de sede). Se elimina explícitamente antes
--  de crear la nueva.
-- ─────────────────────────────────────────────────────────────────────────

drop function if exists public.asignar_folio(uuid, public.servicio_tipo);

create or replace function public.asignar_folio(
  p_expediente_id uuid,
  p_servicio public.servicio_tipo,
  p_sede text default 'general'
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
  v_sede_cod      text;
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

  insert into public.folio_contador (jornada_id, servicio, sede, ultimo)
  values (v_jornada_id, p_servicio, p_sede, 1)
  on conflict (jornada_id, servicio, sede)
  do update set ultimo = public.folio_contador.ultimo + 1
  returning ultimo into v_consecutivo;

  v_letra := case p_servicio when 'cirugia' then 'C' when 'laser' then 'L' end;
  v_sede_cod := case p_sede when 'gto' then 'GTO' when 'leon' then 'LEON' else null end;
  v_folio_texto := 'NA-' || v_jornada_clave || '-' || v_letra
    || coalesce('-' || v_sede_cod, '') || '-' || lpad(v_consecutivo::text, 4, '0');
  v_digito := public.calcular_digito_verificador(v_folio_texto);

  insert into public.folio (
    expediente_id, jornada_id, servicio, sede, consecutivo, folio_texto, digito_verificador
  )
  values (
    p_expediente_id, v_jornada_id, p_servicio, p_sede, v_consecutivo, v_folio_texto, v_digito
  )
  returning * into v_folio;

  return v_folio;
end;
$$;

revoke execute on function public.asignar_folio(uuid, public.servicio_tipo, text) from public;
grant execute on function public.asignar_folio(uuid, public.servicio_tipo, text) to authenticated;
