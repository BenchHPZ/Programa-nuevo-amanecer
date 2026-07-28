-- ─────────────────────────────────────────────────────────────────────────
--  La foto del paciente la toma el médico, no el capturista — al revés que
--  el resto de `documento` (acta, CURP, INE, comprobante, estudio previo),
--  que sigue siendo terreno exclusivo del capturista/administrativo.
--  `capturistas_crean_documento` se reemplaza para excluir 'foto_paciente'
--  explícitamente, y se añade una política aparte solo para ese tipo.
-- ─────────────────────────────────────────────────────────────────────────

drop policy "capturistas_crean_documento" on public.documento;

create policy "capturistas_crean_documento" on public.documento for insert
  with check (public.puede_escribir() and tipo <> 'foto_paciente');

create policy "medicos_crean_foto_paciente" on public.documento for insert
  with check (
    tipo = 'foto_paciente'
    and public.tiene_rol(array['medico_triage', 'administrativo']::public.rol_usuario[])
  );
