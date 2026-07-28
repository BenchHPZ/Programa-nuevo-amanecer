-- ─────────────────────────────────────────────────────────────────────────
--  RF-170/171 (ampliación): la portada debe poder mostrar cómo va la
--  jornada activa — total de expedientes, cuántos completos, cuántos
--  dictaminados — sin exponer un solo dato de paciente. `vista_conteos_jornada`
--  (usada en /admin) no sirve para esto: es security_invoker y por lo tanto
--  respeta el RLS de `expediente`, que no deja leer nada a `anon`.
--
--  Esta vista es deliberadamente NO security_invoker: corre con el
--  privilegio de quien la crea (igual que cualquier vista sin esa cláusula
--  desde PG15), así que sí atraviesa el RLS de expediente/dictamen_etapa1 —
--  pero solo expone conteos agregados, nunca una fila de paciente. Es el
--  mismo argumento de seguridad que ya se usó para hacer pública toda la
--  tabla `jornada` en 20260802090000_landing_publica.sql.
-- ─────────────────────────────────────────────────────────────────────────

create view public.vista_conteos_publicos as
select
  e.jornada_id,
  count(*) as total_expedientes,
  count(*) filter (where e.estado = 'completo') as completos,
  count(*) filter (where e.estado = 'dictaminado') as dictaminados,
  count(*) filter (where d.resultado = 'apto_cirugia') as apto_cirugia,
  count(*) filter (where d.resultado = 'apto_laser') as apto_laser,
  count(*) filter (where e.creado_en::date = current_date) as registrados_hoy
from public.expediente e
left join public.dictamen_etapa1 d on d.expediente_id = e.id
where e.activo
group by e.jornada_id;

comment on view public.vista_conteos_publicos is
  'Conteos agregados por jornada, sin heredar RLS (a diferencia de
   vista_conteos_jornada) — para la portada pública. No debe ganar nunca una
   columna que identifique a una persona.';

grant select on public.vista_conteos_publicos to anon;
