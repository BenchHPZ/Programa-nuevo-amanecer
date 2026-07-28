-- ─────────────────────────────────────────────────────────────────────────
--  invitarColaborador() usa el cliente de service_role (crearClienteAdmin)
--  porque auth.admin.generateLink() no existe en el cliente normal — y
--  service_role omite RLS, pero NO trae privilegios de tabla por omisión
--  (mismo problema ya documentado en 20260802090000_landing_publica.sql
--  para pre_registro/registro_colaborador, solo que ahí era de lectura).
--
--  Sin esto, la acción crea la cuenta en auth.users pero truena al intentar
--  activarla en usuario_perfil o marcar registro_colaborador.usuario_id —
--  confirmado en pruebas: "permission denied for table usuario_perfil".
-- ─────────────────────────────────────────────────────────────────────────

grant select, update on public.usuario_perfil to service_role;
grant update on public.registro_colaborador to service_role;
