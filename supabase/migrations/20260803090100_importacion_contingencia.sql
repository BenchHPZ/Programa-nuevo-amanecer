-- ─────────────────────────────────────────────────────────────────────────
--  RF-193: importación de lo capturado en papel durante una contingencia.
-- ─────────────────────────────────────────────────────────────────────────

-- Una fila del CSV son cuatro escrituras: paciente, responsable, vínculo y
-- expediente. Si se hacen sueltas y falla la tercera, queda un paciente sin
-- responsable y sin expediente — basura silenciosa en el padrón, justo
-- después de una caída, que es cuando menos ganas hay de auditar a mano.
-- Aquí las cuatro van en la transacción del llamador: o entra la fila
-- completa o no entra nada.
--
-- Sobre reutilizar personas: solo se reutiliza con **CURP idéntica**, que es
-- inequívoca. Las coincidencias por nombre o teléfono se le muestran al
-- administrativo en la previsualización, pero NO se fusionan solas: unir dos
-- expedientes de personas distintas en una importación masiva es mucho más
-- caro de deshacer que capturar un duplicado y conciliarlo después (RF-1503).
create or replace function public.importar_expediente_contingencia(
  p_jornada_id   uuid,
  p_paciente     jsonb,
  p_responsable  jsonb,
  p_parentesco   text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paciente_id    uuid;
  v_responsable_id uuid;
  v_expediente_id  uuid;
  v_curp_paciente  text := nullif(upper(trim(coalesce(p_paciente ->> 'curp', ''))), '');
  v_curp_resp      text := nullif(upper(trim(coalesce(p_responsable ->> 'curp', ''))), '');
begin
  if not public.tiene_rol(array['administrativo']::public.rol_usuario[]) then
    raise exception 'No autorizado para importar';
  end if;

  if not exists (select 1 from public.jornada where id = p_jornada_id) then
    raise exception 'La jornada % no existe', p_jornada_id;
  end if;

  -- ── Paciente ──
  if v_curp_paciente is not null then
    select id into v_paciente_id from public.persona where curp = v_curp_paciente;
  end if;

  if v_paciente_id is null then
    insert into public.persona (
      nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo,
      curp, telefono, municipio, estado_geografico, creado_por
    )
    values (
      p_paciente ->> 'nombre',
      p_paciente ->> 'apellido_paterno',
      nullif(p_paciente ->> 'apellido_materno', ''),
      (p_paciente ->> 'fecha_nacimiento')::date,
      p_paciente ->> 'sexo',
      v_curp_paciente,
      nullif(p_paciente ->> 'telefono', ''),
      nullif(p_paciente ->> 'municipio', ''),
      nullif(p_paciente ->> 'estado_geografico', ''),
      auth.uid()
    )
    returning id into v_paciente_id;
  end if;

  -- ── Responsable ──
  if v_curp_resp is not null then
    select id into v_responsable_id from public.persona where curp = v_curp_resp;
  end if;

  if v_responsable_id is null then
    insert into public.persona (
      nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo,
      curp, telefono, creado_por
    )
    values (
      p_responsable ->> 'nombre',
      p_responsable ->> 'apellido_paterno',
      nullif(p_responsable ->> 'apellido_materno', ''),
      -- El formato en papel no pide la fecha de nacimiento del adulto y la
      -- columna es NOT NULL. Se usa una fecha centinela evidente en vez de
      -- inventar uno plausible, para que se note que falta y se corrija.
      coalesce((nullif(p_responsable ->> 'fecha_nacimiento', ''))::date, date '1900-01-01'),
      coalesce(nullif(p_responsable ->> 'sexo', ''), 'M'),
      v_curp_resp,
      nullif(p_responsable ->> 'telefono', ''),
      auth.uid()
    )
    returning id into v_responsable_id;
  end if;

  if v_paciente_id = v_responsable_id then
    raise exception 'El paciente y el responsable no pueden ser la misma persona';
  end if;

  -- ── Vínculo y expediente ──
  insert into public.paciente_responsable (paciente_id, responsable_id, parentesco)
  values (v_paciente_id, v_responsable_id, p_parentesco)
  on conflict (paciente_id, responsable_id) do update set parentesco = excluded.parentesco;

  select id into v_expediente_id
  from public.expediente
  where paciente_id = v_paciente_id and jornada_id = p_jornada_id and activo;

  if v_expediente_id is null then
    insert into public.expediente (paciente_id, jornada_id, creado_por)
    values (v_paciente_id, p_jornada_id, auth.uid())
    returning id into v_expediente_id;
  end if;

  return v_expediente_id;
end;
$$;

comment on function public.importar_expediente_contingencia is
  'RF-193: alta atómica de una fila del CSV de contingencia. Reutiliza persona
   solo por CURP idéntica; nunca fusiona por coincidencia difusa.';

revoke execute on function public.importar_expediente_contingencia(uuid, jsonb, jsonb, text) from public;
grant execute on function public.importar_expediente_contingencia(uuid, jsonb, jsonb, text) to authenticated;
