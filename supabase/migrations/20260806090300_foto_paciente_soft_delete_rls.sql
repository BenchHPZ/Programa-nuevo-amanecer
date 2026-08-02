-- ─────────────────────────────────────────────────────────────────────────
--  Solo médico de triage y administrativo pueden "eliminar" (desactivar)
--  una foto del paciente — mismos roles que ya pueden subirla
--  (medicos_crean_foto_paciente, 20260804090110_foto_paciente_rls.sql).
--  Acotada a tipo = 'foto_paciente': el resto de `documento` no tiene UPDATE
--  policy y sigue sin poder desactivarse desde la aplicación.
-- ─────────────────────────────────────────────────────────────────────────

create policy "medicos_desactivan_foto_paciente" on public.documento for update
  using (
    tipo = 'foto_paciente'
    and public.tiene_rol(array['medico_triage', 'administrativo']::public.rol_usuario[])
  )
  with check (
    tipo = 'foto_paciente'
    and public.tiene_rol(array['medico_triage', 'administrativo']::public.rol_usuario[])
  );
