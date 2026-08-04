-- ─────────────────────────────────────────────────────────────────────────
--  Cirugía Guanajuato y Cirugía León numeran cada una desde 1, con su propia
--  serie de folio — no comparten consecutivo entre sí ni con la cirugía
--  genérica. `sede` es NOT NULL con un sentinela ('general') a propósito:
--  una columna en NULL nunca "empata" para un UNIQUE/ON CONFLICT en
--  Postgres, así que dejarla nullable habría roto el contador atómico de
--  láser (cada llamada insertaría una fila nueva en vez de incrementar).
--
--  Códigos cortos ('general' | 'gto' | 'leon'), no el nombre completo de la
--  sede: son los que arma asignar_folio() en el propio texto del folio
--  (ver ..._asignar_folio_sede.sql).
-- ─────────────────────────────────────────────────────────────────────────

alter table public.folio_contador add column sede text not null default 'general';
alter table public.folio_contador drop constraint folio_contador_pkey;
alter table public.folio_contador add primary key (jornada_id, servicio, sede);

alter table public.folio add column sede text not null default 'general';
alter table public.folio drop constraint folio_jornada_id_servicio_consecutivo_key;
alter table public.folio add constraint folio_jornada_id_servicio_sede_consecutivo_key
  unique (jornada_id, servicio, sede, consecutivo);

comment on table public.folio is
  'Único e irrepetible por jornada, servicio y sede (RN-06). Formato:
   NA-{jornada}-{C|L}[-{sede}]-{consecutivo}, el segmento de sede solo
   aparece cuando sede <> ''general''. Ver función asignar_folio().';
