-- ─────────────────────────────────────────────────────────────────────────
--  Ajustes descubiertos al construir la pantalla de captura (Día 3).
-- ─────────────────────────────────────────────────────────────────────────

-- RF-127 exige que el capturista vea "cuál fue la última carga o
-- modificación" de SU expediente. La política original (20260727090100)
-- solo dejaba leer audit_log a informista/administrativo — demasiado
-- estrecha. Cualquier usuario activo puede leerla: no expone más de lo que
-- ya ve en los propios registros (nombres, fechas), solo agrega quién y
-- cuándo tocó cada cosa.
drop policy "informistas_y_admin_leen_auditoria" on public.audit_log;

create policy "activos_leen_auditoria" on public.audit_log for select
  using (public.esta_activo());
