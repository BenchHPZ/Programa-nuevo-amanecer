-- ─────────────────────────────────────────────────────────────────────────
--  Adjunta el trigger genérico de auditoría (registrar_auditoria, definido
--  en 20260727090100) a cada tabla que deba trazarse. RNF-01.
-- ─────────────────────────────────────────────────────────────────────────

create trigger auditoria_usuario_perfil
  after insert or update or delete on public.usuario_perfil
  for each row execute function public.registrar_auditoria();

create trigger auditoria_jornada
  after insert or update or delete on public.jornada
  for each row execute function public.registrar_auditoria();

create trigger auditoria_persona
  after insert or update or delete on public.persona
  for each row execute function public.registrar_auditoria();

create trigger auditoria_paciente_responsable
  after insert or update or delete on public.paciente_responsable
  for each row execute function public.registrar_auditoria();

create trigger auditoria_expediente
  after insert or update or delete on public.expediente
  for each row execute function public.registrar_auditoria();

create trigger auditoria_expediente_seccion
  after insert or update or delete on public.expediente_seccion
  for each row execute function public.registrar_auditoria();

create trigger auditoria_dictamen_etapa1
  after insert or update or delete on public.dictamen_etapa1
  for each row execute function public.registrar_auditoria();

create trigger auditoria_folio
  after insert or update or delete on public.folio
  for each row execute function public.registrar_auditoria();

create trigger auditoria_consentimiento
  after insert or update or delete on public.consentimiento
  for each row execute function public.registrar_auditoria();

create trigger auditoria_documento
  after insert or update or delete on public.documento
  for each row execute function public.registrar_auditoria();

create trigger auditoria_catalogo_campos
  after insert or update or delete on public.catalogo_campos
  for each row execute function public.registrar_auditoria();

create trigger auditoria_pre_registro
  after insert or update or delete on public.pre_registro
  for each row execute function public.registrar_auditoria();
