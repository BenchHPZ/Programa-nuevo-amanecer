-- ─────────────────────────────────────────────────────────────────────────
--  RF-170/171: la convocatoria (sede y fechas de la jornada) debe ser
--  pública, pero la política de jornada solo dejaba leer a usuarios
--  activos con sesión. Sede, fechas y nombre no son datos sensibles — es
--  justo lo que la landing necesita anunciar. Se añade una política para
--  `anon`, sin tocar las de escritura (siguen solo para administrativo).
-- ─────────────────────────────────────────────────────────────────────────

grant select on public.jornada to anon;

create policy "publico_lee_jornada" on public.jornada for select
  to anon
  using (true);

-- ─────────────────────────────────────────────────────────────────────────
--  RF-182: la acción de pre-registro usa el cliente service_role para
--  contar envíos recientes del mismo teléfono (un visitante anónimo no
--  puede leer la bandeja por RLS, ni debería). service_role omite RLS por
--  completo, pero eso no sustituye el GRANT de privilegios de tabla — sin
--  esto, la consulta fallaba en silencio con "permission denied" y el
--  límite de abuso nunca se aplicaba.
-- ─────────────────────────────────────────────────────────────────────────

grant select on public.pre_registro to service_role;
