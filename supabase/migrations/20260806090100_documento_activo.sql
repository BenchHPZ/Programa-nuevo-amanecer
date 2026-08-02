-- ─────────────────────────────────────────────────────────────────────────
--  `documento` gana `activo`, igual que `persona`/`expediente`/`folio`: el
--  sistema nunca borra filas (NOM-004, regla ya aplicada en todo lo demás).
--  Primer uso: permitir que el médico "elimine" una foto del paciente sin
--  romper esa regla — ver 20260806090300_foto_paciente_soft_delete_rls.sql.
--
--  `activo` se agrega a la tabla completa (no solo a foto_paciente) para
--  seguir el mismo patrón que el resto del sistema y evitar una tabla lado
--  aparte; no cambia nada para los otros 5 tipos de documento, que hoy no
--  tienen ninguna vía para desactivarse.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.documento add column activo boolean not null default true;

drop policy "activos_leen_documento" on public.documento;

create policy "activos_leen_documento" on public.documento for select
  using (public.esta_activo() and activo);

-- Antes solo select+insert; el borrado lógico requiere update. `delete`
-- se mantiene revocado (20260727090300_rls.sql) — nunca se borra de verdad.
grant update on public.documento to authenticated;
