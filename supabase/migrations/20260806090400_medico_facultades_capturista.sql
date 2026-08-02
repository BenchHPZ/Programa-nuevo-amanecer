-- ─────────────────────────────────────────────────────────────────────────
--  El médico de triage, mientras trabaja en /captura, pasa a tener las
--  mismas facultades que capturista/administrativo: editar persona,
--  paciente_responsable, expediente, expediente_seccion (ambas secciones,
--  no solo antecedentes), consentimiento, documento (tipos no-foto) y
--  pre_registro, además de subir al bucket 'papeleria' — todo lo que ya
--  gatea `puede_escribir()` en 20260727090300_rls.sql.
--
--  RLS no distingue por ruta: este permiso queda a nivel de base de datos,
--  no solo en /captura. En la práctica solo se ejerce ahí porque
--  /dictamen/[expedienteId] nunca ofrece edición de persona, socioeconómico
--  ni papelería no-foto — esa pantalla sigue mostrando solo lo que ya
--  correspondía al papel de médico (historia clínica, foto, dictamen).
--
--  No quita nada a las políticas ya existentes de médico
--  (medicos_crean_foto_paciente, medicos_crean_antecedentes, etc.):
--  Postgres combina políticas permisivas con OR, así que esto solo agrega
--  permiso.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.puede_escribir()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.tiene_rol(array['capturista', 'administrativo', 'medico_triage']::public.rol_usuario[]);
$$;
