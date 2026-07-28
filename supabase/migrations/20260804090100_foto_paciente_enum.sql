-- ─────────────────────────────────────────────────────────────────────────
--  Requerimiento original (nunca construido): guardar una fotografía del
--  paciente, tomada con la cámara del celular en campo. Se modela como un
--  tipo más de `documento` — reutiliza el bucket `papeleria`, las políticas
--  de tamaño/mimetype y `urlFirmadaPapeleria()` — en vez de una tabla aparte.
--
--  Separado en su propia migración: un valor nuevo de enum no se puede usar
--  (comparar, castear) dentro de la misma transacción en la que se agrega.
--  La política RLS que lo usa vive en la siguiente migración.
-- ─────────────────────────────────────────────────────────────────────────

alter type public.tipo_documento add value 'foto_paciente';
