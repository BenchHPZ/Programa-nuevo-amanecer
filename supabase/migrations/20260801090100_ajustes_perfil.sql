-- ─────────────────────────────────────────────────────────────────────────
--  usuario_perfil: la política de lectura original solo dejaba ver el
--  propio perfil, o cualquiera si eras administrativo. Eso rompe la
--  atribución que ya muestra la app (RF-127 "última modificación", el
--  nombre del médico en el dictamen y en la constancia impresa): un
--  capturista no podía ver el nombre del médico, ni un médico el de un
--  capturista. Mismo tipo de vacío ya corregido para audit_log en
--  20260729090000_ajustes_captura.sql — no era una restricción deliberada
--  de datos sensibles: el nombre y rol del personal no lo son dentro de
--  la operación.
-- ─────────────────────────────────────────────────────────────────────────

drop policy "cada_quien_ve_su_propio_perfil" on public.usuario_perfil;

create policy "activos_leen_perfiles" on public.usuario_perfil for select
  using (id = auth.uid() or public.esta_activo());
