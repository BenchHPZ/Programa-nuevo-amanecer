-- ─────────────────────────────────────────────────────────────────────────
--  La rama de nombre de buscar_persona_similar() exigía nombre Y fecha de
--  nacimiento a la vez — buscar solo por nombre no devolvía nada, y en
--  campo casi nunca se tienen los dos datos de memoria. CURP y teléfono ya
--  funcionaban con un solo dato; esta función iguala nombre y fecha al
--  mismo estándar: cualquiera de los cuatro debe bastar por sí solo.
--
--  Se mantiene la rama nombre_fecha (ambos datos juntos) porque sigue
--  siendo la señal más fuerte cuando se tienen los dos — solo deja de ser
--  la única forma de buscar por nombre.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.buscar_persona_similar(
  p_curp             text default null,
  p_nombre           text default null,
  p_apellido_paterno text default null,
  p_apellido_materno text default null,
  p_fecha_nacimiento date default null,
  p_sexo             text default null,
  p_telefono         text default null
)
returns table (
  id                uuid,
  curp              text,
  nombre            text,
  apellido_paterno  text,
  apellido_materno  text,
  fecha_nacimiento  date,
  sexo              text,
  telefono          text,
  similitud         real,
  motivo            text
)
language sql
stable
set search_path = public, extensions
as $$
  with nombre_buscado as (
    select public.sin_acentos(lower(
      coalesce(p_nombre, '') || ' ' ||
      coalesce(p_apellido_paterno, '') || ' ' ||
      coalesce(p_apellido_materno, '')
    )) as texto
  )
  select p.id, p.curp, p.nombre, p.apellido_paterno, p.apellido_materno,
         p.fecha_nacimiento, p.sexo, p.telefono,
         1.0::real as similitud, 'curp'::text as motivo
  from public.persona p
  where p_curp is not null and p.curp = p_curp and p.activo

  union all

  -- Nombre y fecha juntos: la señal más fuerte, cuando se tienen los dos.
  select p.id, p.curp, p.nombre, p.apellido_paterno, p.apellido_materno,
         p.fecha_nacimiento, p.sexo, p.telefono,
         extensions.similarity(p.nombre_normalizado, nb.texto) as similitud,
         'nombre_fecha'::text as motivo
  from public.persona p, nombre_buscado nb
  where p_nombre is not null
    and p_fecha_nacimiento is not null
    and p.fecha_nacimiento = p_fecha_nacimiento
    and (p_sexo is null or p.sexo = p_sexo)
    and p.activo
    and extensions.similarity(p.nombre_normalizado, nb.texto) > 0.3

  union all

  -- Solo nombre: sin fecha para acotar, pero un solo dato ya debe bastar.
  select p.id, p.curp, p.nombre, p.apellido_paterno, p.apellido_materno,
         p.fecha_nacimiento, p.sexo, p.telefono,
         extensions.similarity(p.nombre_normalizado, nb.texto) as similitud,
         'nombre'::text as motivo
  from public.persona p, nombre_buscado nb
  where p_nombre is not null
    and p_fecha_nacimiento is null
    and (p_sexo is null or p.sexo = p_sexo)
    and p.activo
    and extensions.similarity(p.nombre_normalizado, nb.texto) > 0.3

  union all

  -- Solo fecha de nacimiento: cubre a quien recuerda cuándo nació el
  -- paciente pero no cómo escribir su nombre completo.
  select p.id, p.curp, p.nombre, p.apellido_paterno, p.apellido_materno,
         p.fecha_nacimiento, p.sexo, p.telefono,
         0.4::real as similitud, 'fecha'::text as motivo
  from public.persona p
  where p_nombre is null
    and p_fecha_nacimiento is not null
    and p.fecha_nacimiento = p_fecha_nacimiento
    and (p_sexo is null or p.sexo = p_sexo)
    and p.activo

  union all

  select p.id, p.curp, p.nombre, p.apellido_paterno, p.apellido_materno,
         p.fecha_nacimiento, p.sexo, p.telefono,
         0.5::real as similitud, 'telefono'::text as motivo
  from public.persona p
  where p_telefono is not null and p.telefono = p_telefono and p.activo

  order by similitud desc
$$;

revoke execute on function public.buscar_persona_similar from public;
grant execute on function public.buscar_persona_similar to authenticated;
