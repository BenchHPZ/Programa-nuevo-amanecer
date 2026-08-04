-- ─────────────────────────────────────────────────────────────────────────
--  Fase 2: salidas de dictamen configurables por jornada. Esta edición pide
--  dividir "apto para cirugía" por sede — Guanajuato y León, cada una con su
--  propia serie de folio (ver ..._folio_sede.sql). `apto_cirugia` (genérico,
--  sin sede) se queda tal cual para jornadas que no necesiten la división;
--  ningún dictamen histórico cambia de significado.
--
--  En su propia migración porque `alter type ... add value` no puede correr
--  en la misma transacción que su primer uso (mismo patrón que
--  20260804090100_foto_paciente_enum.sql).
-- ─────────────────────────────────────────────────────────────────────────

alter type public.resultado_dictamen add value 'cirugia_guanajuato';
alter type public.resultado_dictamen add value 'cirugia_leon';
