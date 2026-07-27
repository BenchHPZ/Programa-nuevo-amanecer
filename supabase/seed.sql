-- ═════════════════════════════════════════════════════════════════════════
--  DATOS SINTÉTICOS — para desarrollo local únicamente.
--
--  Ningún paciente, responsable, teléfono o CURP de aquí es real. Este
--  archivo SÍ se versiona (README.md, RNF-12) precisamente porque no
--  contiene datos reales. Nunca copies aquí una captura de la operación.
--
--  Ejecuta con:  npx supabase db reset
-- ═════════════════════════════════════════════════════════════════════════

-- ── Usuarios sintéticos, uno por rol de Etapa 1 ────────────────────────────
-- Se insertan directamente en auth.users (patrón estándar de seed local de
-- Supabase) para poder ejercer el flujo completo de aprobación. El trigger
-- al_registrarse_usuario crea automáticamente su usuario_perfil en estado
-- 'pendiente'; después lo llevamos a 'activo' con rol, tal como lo haría un
-- administrativo desde el panel (RF-102).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'admin.demo@ejemplo.org',
   extensions.crypt('demo-solo-local', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Administrativo Demo"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'capturista.demo@ejemplo.org',
   extensions.crypt('demo-solo-local', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Capturista Demo"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'medico.demo@ejemplo.org',
   extensions.crypt('demo-solo-local', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Dr. Médico Demo"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000004',
   'authenticated', 'authenticated', 'informista.demo@ejemplo.org',
   extensions.crypt('demo-solo-local', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Informista Demo"}',
   now(), now(), '', '', '', ''),
  -- Este NO se aprueba: demuestra RF-101 / RN-10 (pendiente = sin acceso).
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000005',
   'authenticated', 'authenticated', 'pendiente.demo@ejemplo.org',
   extensions.crypt('demo-solo-local', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Usuario Pendiente Demo"}',
   now(), now(), '', '', '', '');

update public.usuario_perfil set rol = 'administrativo', estado = 'activo',
  aprobado_por = '10000000-0000-0000-0000-000000000001', aprobado_en = now()
  where id = '10000000-0000-0000-0000-000000000001';
update public.usuario_perfil set rol = 'capturista', estado = 'activo',
  aprobado_por = '10000000-0000-0000-0000-000000000001', aprobado_en = now()
  where id = '10000000-0000-0000-0000-000000000002';
update public.usuario_perfil set rol = 'medico_triage', estado = 'activo',
  aprobado_por = '10000000-0000-0000-0000-000000000001', aprobado_en = now()
  where id = '10000000-0000-0000-0000-000000000003';
update public.usuario_perfil set rol = 'informista', estado = 'activo',
  aprobado_por = '10000000-0000-0000-0000-000000000001', aprobado_en = now()
  where id = '10000000-0000-0000-0000-000000000004';
-- 10000000-...-0005 queda 'pendiente', sin rol: a propósito.

-- ── Jornadas ────────────────────────────────────────────────────────────
-- Fechas y sede deliberadamente distintas de la jornada real (Guanajuato,
-- 3-7 ago 2026) para que nadie confunda esta demo con datos de operación.
insert into public.jornada (id, clave, nombre, sede, fecha_inicio_etapa1, fecha_fin_etapa1, fecha_etapa2, estado) values
  ('20000000-0000-0000-0000-000000000001', '2025A-DEMO', 'Jornada demo — histórica',
   'Hospital de Pruebas, Ciudad Ejemplo', '2025-02-03', '2025-02-07', '2025-03-20', 'cerrada'),
  ('20000000-0000-0000-0000-000000000002', '2026A-DEMO', 'Jornada demo — en curso',
   'Hospital de Pruebas, Ciudad Ejemplo', '2026-01-12', '2026-01-16', '2026-02-27', 'etapa1');

-- ── Catálogo de campos de la jornada demo (RF-130) ─────────────────────────
-- CATÁLOGO BASE PROPUESTO — pendiente de validación por la asociación
-- (docs/PLAN.md §10, pendiente #1). Se editará sin desplegar código desde
-- /admin/catalogo en cuanto llegue el catálogo real (RF-131).
insert into public.catalogo_campos (jornada_id, seccion, definicion, version, vigente) values
  ('20000000-0000-0000-0000-000000000002', 'antecedentes', '{
     "campos": [
       {"clave": "diagnostico", "etiqueta": "Diagnóstico", "tipo": "texto", "requerido": true},
       {"clave": "tipo_hendidura", "etiqueta": "Tipo de hendidura", "tipo": "seleccion",
        "opciones": ["labio", "paladar", "labio_y_paladar"], "requerido": true},
       {"clave": "lateralidad", "etiqueta": "Lateralidad", "tipo": "seleccion",
        "opciones": ["unilateral", "bilateral"], "requerido": false},
       {"clave": "tipo_sangre", "etiqueta": "Tipo de sangre", "tipo": "seleccion",
        "opciones": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "No sabe"], "requerido": false},
       {"clave": "peso_kg", "etiqueta": "Peso (kg)", "tipo": "numero", "requerido": false},
       {"clave": "talla_cm", "etiqueta": "Talla (cm)", "tipo": "numero", "requerido": false},
       {"clave": "fecha_ultimo_chequeo", "etiqueta": "Fecha del último chequeo médico", "tipo": "fecha", "requerido": false},
       {"clave": "cirugias_previas", "etiqueta": "Cirugías previas", "tipo": "texto_largo", "requerido": false},
       {"clave": "alergias", "etiqueta": "Alergias", "tipo": "texto", "requerido": false},
       {"clave": "medicamentos_actuales", "etiqueta": "Medicamentos actuales", "tipo": "texto_largo", "requerido": false},
       {"clave": "comorbilidades", "etiqueta": "Comorbilidades", "tipo": "seleccion_multiple",
        "opciones": ["cardiopatía", "desnutrición", "anemia", "asma", "epilepsia", "ninguna"], "requerido": false},
       {"clave": "vacunacion_completa", "etiqueta": "¿Esquema de vacunación completo?", "tipo": "booleano", "requerido": true},
       {"clave": "observaciones_medicas", "etiqueta": "Observaciones médicas", "tipo": "texto_largo", "requerido": false}
     ]
   }'::jsonb, 1, true),
  ('20000000-0000-0000-0000-000000000002', 'socioeconomico', '{
     "campos": [
       {"clave": "ocupacion_responsable", "etiqueta": "Ocupación del responsable", "tipo": "texto", "requerido": false},
       {"clave": "ingreso_mensual_aprox", "etiqueta": "Ingreso mensual aproximado", "tipo": "numero", "requerido": false},
       {"clave": "integrantes_hogar", "etiqueta": "Integrantes del hogar", "tipo": "numero", "requerido": false},
       {"clave": "cuenta_seguridad_social", "etiqueta": "¿Cuenta con seguridad social?", "tipo": "booleano", "requerido": true},
       {"clave": "institucion_seguridad_social", "etiqueta": "Institución (IMSS, ISSSTE…)", "tipo": "texto", "requerido": false},
       {"clave": "tipo_vivienda", "etiqueta": "Tipo de vivienda", "tipo": "seleccion",
        "opciones": ["propia", "rentada", "prestada", "otro"], "requerido": false},
       {"clave": "servicios_disponibles", "etiqueta": "Servicios disponibles en el hogar", "tipo": "seleccion_multiple",
        "opciones": ["agua", "luz", "drenaje", "internet"], "requerido": false},
       {"clave": "recibe_apoyo_gubernamental", "etiqueta": "¿Recibe algún apoyo gubernamental?", "tipo": "booleano", "requerido": false},
       {"clave": "programa_apoyo", "etiqueta": "¿Cuál programa?", "tipo": "texto", "requerido": false},
       {"clave": "distancia_a_sede_km", "etiqueta": "Distancia aproximada a la sede (km)", "tipo": "numero", "requerido": false},
       {"clave": "observaciones_socioeconomicas", "etiqueta": "Observaciones", "tipo": "texto_largo", "requerido": false}
     ]
   }'::jsonb, 1, true);

-- ── Personas ────────────────────────────────────────────────────────────
-- Sin CURP: evita que un patrón con forma de CURP real quede en un archivo
-- versionado, y de paso mantiene honesto al guardia pre-commit (RNF-13).
insert into public.persona (id, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, telefono, estado_geografico, municipio) values
  ('30000000-0000-0000-0000-000000000001', 'Paciente', 'Ejemplo', 'Uno', '2022-04-10', 'H', '4770000001', 'Guanajuato', 'Municipio Ejemplo'),
  ('30000000-0000-0000-0000-000000000002', 'Responsable', 'Ejemplo', 'Uno', '1990-06-15', 'M', '4770000001', 'Guanajuato', 'Municipio Ejemplo'),
  ('30000000-0000-0000-0000-000000000003', 'Paciente', 'Ejemplo', 'Dos', '2019-11-02', 'M', '4770000002', 'Guanajuato', 'Municipio Ejemplo'),
  ('30000000-0000-0000-0000-000000000004', 'Responsable', 'Ejemplo', 'Dos', '1985-01-20', 'H', '4770000002', 'Guanajuato', 'Municipio Ejemplo'),
  -- Paciente recurrente: ya vino en la jornada histórica, regresa en la demo (RF-113).
  ('30000000-0000-0000-0000-000000000005', 'Paciente', 'Ejemplo', 'Recurrente', '2015-08-22', 'H', '4770000003', 'Guanajuato', 'Municipio Ejemplo'),
  ('30000000-0000-0000-0000-000000000006', 'Responsable', 'Ejemplo', 'Recurrente', '1988-03-11', 'M', '4770000003', 'Guanajuato', 'Municipio Ejemplo');

insert into public.paciente_responsable (paciente_id, responsable_id, parentesco, es_principal) values
  ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'madre', true),
  ('30000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', 'padre', true),
  ('30000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000006', 'madre', true);

-- ── Expediente histórico (jornada cerrada) para el paciente recurrente ────
insert into public.expediente (id, paciente_id, jornada_id, estado, creado_por) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005',
   '20000000-0000-0000-0000-000000000001', 'dictaminado', '10000000-0000-0000-0000-000000000002');

insert into public.dictamen_etapa1 (expediente_id, medico_id, resultado, observaciones, fecha) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003',
   'regresar_6_meses', 'Requiere valoración nutricional previa.', '2025-02-05 10:00:00-06');

-- ── Expedientes de la jornada en curso ──────────────────────────────────
insert into public.expediente (id, paciente_id, jornada_id, estado, creado_por) values
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002', 'dictaminado', '10000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000002', 'dictaminado', '10000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000005',
   '20000000-0000-0000-0000-000000000002', 'dictaminado', '10000000-0000-0000-0000-000000000002');

insert into public.expediente_seccion (expediente_id, seccion, datos, completa) values
  ('40000000-0000-0000-0000-000000000002', 'antecedentes',
   '{"diagnostico": "Labio hendido unilateral", "tipo_hendidura": "labio", "lateralidad": "unilateral"}', true),
  ('40000000-0000-0000-0000-000000000002', 'socioeconomico',
   '{"cuenta_seguridad_social": false, "integrantes_hogar": 4}', true),
  ('40000000-0000-0000-0000-000000000003', 'antecedentes',
   '{"diagnostico": "Cicatriz residual de labio hendido", "tipo_hendidura": "labio"}', true),
  ('40000000-0000-0000-0000-000000000004', 'antecedentes',
   '{"diagnostico": "Paladar hendido bilateral", "tipo_hendidura": "paladar", "lateralidad": "bilateral"}', true);

-- Las cuatro salidas del dictamen (RN-12), representadas en la demo.
insert into public.dictamen_etapa1 (expediente_id, medico_id, resultado, observaciones, fecha) values
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003',
   'apto_cirugia', 'Buen estado general.', now()),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
   'apto_laser', 'Candidata a corrección estética.', now()),
  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003',
   'no_apto', 'Requiere valoración nutricional antes de continuar.', now());

update public.expediente set estado = 'dictaminado'
  where id in (
    '40000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000004'
  );

-- ── Folios ──────────────────────────────────────────────────────────────
-- La aplicación SIEMPRE asigna folio con select public.asignar_folio(...);
-- aquí se inserta directo porque el seed corre sin sesión autenticada
-- (auth.uid() es nulo) y ese RPC exige un usuario activo (RF-151).
insert into public.folio_contador (jornada_id, servicio, ultimo) values
  ('20000000-0000-0000-0000-000000000002', 'cirugia', 1),
  ('20000000-0000-0000-0000-000000000002', 'laser', 1);

insert into public.folio (expediente_id, jornada_id, servicio, consecutivo, folio_texto, digito_verificador) values
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'cirugia', 1,
   'NA-2026A-DEMO-C-0001', public.calcular_digito_verificador('NA-2026A-DEMO-C-0001')),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'laser', 1,
   'NA-2026A-DEMO-L-0001', public.calcular_digito_verificador('NA-2026A-DEMO-L-0001'));

-- ── Papelería (rutas de ejemplo, sin archivos reales) ──────────────────────
insert into public.consentimiento (expediente_id, tipo, archivo_path, firmado_en, capturado_por) values
  ('40000000-0000-0000-0000-000000000002', 'aviso_privacidad', 'demo/placeholder-aviso.jpg', current_date, '10000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000002', 'deslinde', 'demo/placeholder-deslinde.jpg', current_date, '10000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000002', 'uso_imagen', 'demo/placeholder-imagen.jpg', current_date, '10000000-0000-0000-0000-000000000002');

insert into public.documento (expediente_id, tipo, archivo_path, subido_por) values
  ('40000000-0000-0000-0000-000000000002', 'curp', 'demo/placeholder-curp.jpg', '10000000-0000-0000-0000-000000000002');

-- ── Pre-registro público pendiente de validar (RF-181) ─────────────────────
-- La forma del JSON debe coincidir con la que escribe crearPreRegistro() en
-- app/pre-registro/acciones.ts; si no, la bandeja se ve vacía aunque haya filas.
insert into public.pre_registro (datos, estado) values
  ('{"nombre_paciente": "Sofia Perez Ejemplo", "fecha_nacimiento": "2021-04-18", "nombre_contacto": "Maria Ejemplo Ficticia", "telefono": "4770000099", "servicio_deseado": "cirugia", "municipio": "Leon", "comentarios": "Se enteró por la clínica."}', 'nuevo'),  -- [semilla-sintetica]
  ('{"nombre_paciente": "Diego de la Cruz Muestra", "fecha_nacimiento": "2019-11-02", "nombre_contacto": "Jose de la Cruz", "telefono": "4770000088", "servicio_deseado": "no_se", "municipio": "Irapuato", "comentarios": null}', 'nuevo');  -- [semilla-sintetica]
