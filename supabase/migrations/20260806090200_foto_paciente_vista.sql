-- ─────────────────────────────────────────────────────────────────────────
--  Las fotos del paciente se organizan en 3 vistas fijas (anterior, lateral
--  derecha, lateral izquierda), máximo 3 fotos por vista (RF nuevo). La
--  columna es nullable porque solo aplica cuando tipo = 'foto_paciente' — el
--  resto de `documento` (acta, curp, ine, comprobante, estudio_previo) no
--  tiene noción de "vista".
-- ─────────────────────────────────────────────────────────────────────────

create type public.vista_foto as enum ('anterior', 'lateral_derecha', 'lateral_izquierda');

alter table public.documento add column vista_foto public.vista_foto;

alter table public.documento add constraint documento_vista_solo_foto
  check (vista_foto is null or tipo = 'foto_paciente');
