-- ─────────────────────────────────────────────────────────────────────────
--  Almacenamiento privado para papelería (RF-165): consentimientos
--  firmados escaneados y documentos de soporte. Sin URL firmada no hay
--  acceso — el bucket no es público.
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('papeleria', 'papeleria', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']);

-- Lectura: cualquier usuario activo (para generar su URL firmada al ver el
-- expediente). Escritura: solo quien puede escribir en el resto de la
-- captura (capturista/administrativo) — mismo criterio que consentimiento y
-- documento en RLS. Se permite UPDATE (no solo INSERT) porque un escaneo
-- borroso se vuelve a subir sobre la misma ruta (upsert), nunca se elimina
-- el bucket no otorga DELETE a nadie: es el mismo principio de no-borrado
-- que ya rige las tablas (NOM-004).
create policy "activos_leen_papeleria" on storage.objects for select
  to authenticated
  using (bucket_id = 'papeleria' and public.esta_activo());

create policy "capturistas_suben_papeleria" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'papeleria' and public.puede_escribir());

create policy "capturistas_actualizan_papeleria" on storage.objects for update
  to authenticated
  using (bucket_id = 'papeleria' and public.puede_escribir())
  with check (bucket_id = 'papeleria' and public.puede_escribir());
