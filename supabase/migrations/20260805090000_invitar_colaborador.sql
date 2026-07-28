-- ─────────────────────────────────────────────────────────────────────────
--  Invitar directamente a un colaborador (RF- ampliación): el administrativo
--  ya tiene su nombre y correo en registro_colaborador — puede invitarlo a
--  tener cuenta con rol asignado sin pasar por auto-registro ni aprobación
--  manual aparte. `usuario_id` deja constancia de a quién ya se invitó, para
--  que la pantalla lo muestre y no se generen invitaciones duplicadas.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.registro_colaborador
  add column usuario_id uuid references public.usuario_perfil (id);

comment on column public.registro_colaborador.usuario_id is
  'Se llena cuando un administrativo invita a este colaborador a tener cuenta (invitarColaborador). Null mientras no se le ha invitado.';

-- La tabla decía "no crea cuenta de sistema" — ya no es del todo cierto:
-- sigue sin crearla automáticamente al recibirse el registro, pero ahora un
-- administrativo puede invitarlo explícitamente. Corrige el comentario para
-- que no contradiga lo que hace este archivo.
comment on table public.registro_colaborador is
  'Quien se ofrece a colaborar desde la landing. No crea cuenta de sistema al
   recibirse (RF-101 sigue siendo auto-registro + aprobación) — pero un
   administrativo puede invitar a alguien de aquí directamente, con rol ya
   asignado (usuario_id marca a quién).';
