-- ─────────────────────────────────────────────────────────────────────────
--  subirFotoPaciente() (app/dictamen/acciones.ts) sube primero a
--  storage.objects (bucket 'papeleria') y luego inserta en public.documento.
--  20260804090110_foto_paciente_rls.sql ya dejó que medico_triage inserte
--  en la tabla `documento`, pero nunca se tocó la política de storage:
--  `capturistas_suben_papeleria` (20260801090000_almacenamiento.sql) sigue
--  exigiendo puede_escribir(), que solo cubre capturista/administrativo —
--  medico_triage truena en storage antes de llegar siquiera a la tabla.
--
--  Política aparte (no se ensancha `capturistas_suben_papeleria`), acotada
--  por nombre de archivo al mismo patrón que usa subirFotoPaciente() para
--  la ruta ('<expedienteId>/foto-paciente-<timestamp>.jpg') — el resto de
--  la papelería (consentimientos, estudios) sigue siendo solo de
--  capturista/administrativo.
--
--  Sin política de update: cada subida usa una ruta nueva con timestamp,
--  nunca sobrescribe un objeto existente.
-- ─────────────────────────────────────────────────────────────────────────

create policy "medicos_suben_foto_paciente" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'papeleria'
    and name like '%/foto-paciente-%'
    and public.tiene_rol(array['medico_triage', 'administrativo']::public.rol_usuario[])
  );
