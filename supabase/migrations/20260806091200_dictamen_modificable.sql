-- ─────────────────────────────────────────────────────────────────────────
--  Autoría de una modificación posterior al registro original, mismo patrón
--  que aprobado_por/aprobado_en en usuario_perfil. Nulas: null significa
--  "nunca modificado desde que se registró". La policy de UPDATE sobre
--  dictamen_etapa1 (medicos_actualizan_dictamen, 20260727090300_rls.sql) ya
--  existe desde el esquema base — no hace falta tocar RLS.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.dictamen_etapa1 add column modificado_por uuid references public.usuario_perfil (id);
alter table public.dictamen_etapa1 add column modificado_en timestamptz;
