-- Extensiones requeridas por el esquema.
-- pg_trgm: búsqueda difusa de nombres para deduplicación (RF-110, MODELO-DATOS §3).

create extension if not exists pg_trgm with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pgcrypto with schema extensions;
