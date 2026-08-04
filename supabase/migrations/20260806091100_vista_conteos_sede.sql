-- ─────────────────────────────────────────────────────────────────────────
--  vista_conteos_jornada (20260803090000_panel_admin.sql) gana 2 columnas
--  para las salidas de cirugía por sede, agregadas al final: `create or
--  replace view` exige que las columnas ya existentes conserven nombre y
--  posición — solo se puede añadir columnas nuevas al final de la lista.
--  `security_invoker = true` se repite explícito: sin él la vista se salta
--  el RLS (ver comentario original).
-- ─────────────────────────────────────────────────────────────────────────

create or replace view public.vista_conteos_jornada
with (security_invoker = true) as
select
  e.jornada_id,
  count(*)                                                        as expedientes,
  count(*) filter (where e.estado = 'borrador')                   as borradores,
  count(*) filter (where e.estado = 'completo')                   as completos,
  count(*) filter (where e.estado = 'dictaminado')                as dictaminados,
  count(*) filter (where d.resultado = 'apto_cirugia')            as apto_cirugia,
  count(*) filter (where d.resultado = 'apto_laser')              as apto_laser,
  count(*) filter (where d.resultado = 'no_apto')                 as no_apto,
  count(*) filter (where d.resultado = 'regresar_6_meses')        as regresar_6_meses,
  count(*) filter (where e.creado_en::date = current_date)        as expedientes_hoy,
  count(*) filter (where d.fecha::date = current_date)            as dictaminados_hoy,
  count(*) filter (where d.resultado = 'cirugia_guanajuato')      as cirugia_guanajuato,
  count(*) filter (where d.resultado = 'cirugia_leon')            as cirugia_leon
from public.expediente e
left join public.dictamen_etapa1 d on d.expediente_id = e.id
where e.activo
group by e.jornada_id;

comment on view public.vista_conteos_jornada is
  'RF-192: conteos del día por jornada. security_invoker=true para que respete
   el RLS de las tablas base — sin eso la vista sería una fuga de datos.';

grant select on public.vista_conteos_jornada to authenticated;
