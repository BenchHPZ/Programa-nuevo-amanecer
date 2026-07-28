-- ─────────────────────────────────────────────────────────────────────────
--  El médico de triage pasa a poder editar la sección "antecedentes"
--  (Historia clínica) — hasta ahora solo la leía, como cualquier usuario
--  activo. Sigue sin poder tocar "socioeconomico": esa sección sigue siendo
--  terreno exclusivo de capturista/administrativo vía puede_escribir().
--
--  Políticas permisivas nuevas: Postgres las combina con OR junto a
--  capturistas_crean_seccion/capturistas_actualizan_seccion, así que esto
--  solo añade permiso, no le quita nada a quien ya podía escribir.
-- ─────────────────────────────────────────────────────────────────────────

create policy "medicos_crean_antecedentes" on public.expediente_seccion for insert
  with check (
    seccion = 'antecedentes'
    and public.tiene_rol(array['medico_triage']::public.rol_usuario[])
  );

create policy "medicos_actualizan_antecedentes" on public.expediente_seccion for update
  using (
    seccion = 'antecedentes'
    and public.tiene_rol(array['medico_triage']::public.rol_usuario[])
  )
  with check (
    seccion = 'antecedentes'
    and public.tiene_rol(array['medico_triage']::public.rol_usuario[])
  );
