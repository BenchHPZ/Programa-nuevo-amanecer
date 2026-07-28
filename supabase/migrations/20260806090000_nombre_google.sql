-- ─────────────────────────────────────────────────────────────────────────
--  Inicio de sesión con Google: una cuenta nueva por Google dispara el
--  mismo trigger que el auto-registro por correo (manejar_nuevo_usuario,
--  20260727090100_roles_y_auditoria.sql) — entra igual, en 'pendiente' y
--  sin rol, invisible hasta que un administrativo la apruebe (RN-10). No
--  hay caso especial que agregar ahí.
--
--  Lo único que cambia: Google no manda una clave `nombre` en
--  raw_user_meta_data (manda `full_name` y `name`), así que sin este
--  fallback el nombre mostrado sería el correo completo en vez del nombre
--  real de la persona.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuario_perfil (id, nombre, estado)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'nombre',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.email
    ),
    'pendiente'
  );
  return new;
end;
$$;
