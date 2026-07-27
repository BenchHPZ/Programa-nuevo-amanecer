-- ─────────────────────────────────────────────────────────────────────────
--  Panel administrativo: conteos del día (RF-192) y exportación auditada
--  (RF-191).
-- ─────────────────────────────────────────────────────────────────────────

-- ── Auditoría de exportaciones ───────────────────────────────────────────
-- El trigger genérico solo ve escrituras. Una exportación es una LECTURA que
-- saca del sistema el padrón completo —nombres, fechas de nacimiento,
-- teléfonos y dictámenes de menores de edad— y hoy no dejaría rastro alguno.
--
-- Para la LFPDPPP y para los "registros de auditoría" que pide la NOM-004,
-- saber quién se llevó qué y cuándo importa tanto como saber quién editó qué.
-- Es también parte del expediente de madurez de seguridad que exige la
-- NOM-024 para certificar (docs/CUMPLIMIENTO.md §2.2).
alter table public.audit_log drop constraint audit_log_accion_check;
alter table public.audit_log add constraint audit_log_accion_check
  check (accion in ('INSERT', 'UPDATE', 'DELETE', 'EXPORT'));

comment on column public.audit_log.registro_id is
  'Id de la fila afectada. En accion=''EXPORT'' no hay una sola fila: se guarda
   el id de la jornada exportada, y el detalle (filtros y número de filas) va
   en datos_despues.';

create or replace function public.registrar_exportacion(
  p_jornada_id uuid,
  p_filtros jsonb,
  p_filas integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_administrativo() then
    raise exception 'No autorizado para exportar';
  end if;

  insert into public.audit_log (tabla, registro_id, accion, usuario_id, datos_despues)
  values (
    'expediente',
    p_jornada_id,
    'EXPORT',
    auth.uid(),
    jsonb_build_object('filtros', p_filtros, 'filas', p_filas)
  );
end;
$$;

revoke execute on function public.registrar_exportacion(uuid, jsonb, integer) from public;
grant execute on function public.registrar_exportacion(uuid, jsonb, integer) to authenticated;

-- ── Conteos por jornada (RF-192) ─────────────────────────────────────────
-- Agregar en la base y no en la aplicación: traer 500 filas al servidor para
-- contarlas es desperdicio, y el tablero se consulta a cada rato durante la
-- jornada.
--
-- `security_invoker = true` NO es opcional. Sin él, la vista se ejecuta con
-- los privilegios de su dueño (postgres) y **se salta el RLS** de expediente
-- y dictamen_etapa1: cualquier usuario autenticado podría leer los conteos
-- de todas las jornadas. Con él, la vista ve exactamente lo que vería quien
-- la consulta.
create view public.vista_conteos_jornada
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
  count(*) filter (where d.fecha::date = current_date)            as dictaminados_hoy
from public.expediente e
left join public.dictamen_etapa1 d on d.expediente_id = e.id
where e.activo
group by e.jornada_id;

comment on view public.vista_conteos_jornada is
  'RF-192: conteos del día por jornada. security_invoker=true para que respete
   el RLS de las tablas base — sin eso la vista sería una fuga de datos.';

grant select on public.vista_conteos_jornada to authenticated;
