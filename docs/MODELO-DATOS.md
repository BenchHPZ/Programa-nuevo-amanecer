# Modelo de datos

**Programa Nuevo Amanecer, A.C.**
Versión 1.2 · 6 de agosto de 2026

---

## 1. Decisiones de diseño

### 1.1 Una sola tabla `persona`

Pacientes y adultos responsables viven en la **misma tabla**. Las razones son concretas:

- El adulto responsable de esta jornada puede ser paciente en la siguiente.
- Dos hermanos pacientes comparten al mismo responsable.
- Una madre puede ser responsable de tres pacientes distintos.

Separarlos en dos tablas obliga a duplicar a esa madre tres veces y rompe la unicidad de
persona (RN-01) desde el primer día. La relación se expresa en `paciente_responsable`.

### 1.2 Expediente por jornada, no por paciente

Un paciente acumula **un expediente por cada jornada** en la que participa (RN-02). Esto
permite responder "¿qué se dictaminó de esta persona hace seis meses?" sin sobrescribir nada, y
es lo que hace posible el caso "regresar en 6 meses" (RF-143).

### 1.3 Identidad tipada, contenido clínico en JSONB

| Va en columnas tipadas | Va en JSONB |
|---|---|
| Nombre, apellidos, CURP, fecha de nacimiento, sexo, teléfono, domicilio | Antecedentes médicos, estudio socioeconómico |
| **Porque** se usan para buscar, deduplicar, reportar e imprimir | **Porque** el catálogo lo define la asociación y cambia entre jornadas |

Esto es lo que permite que el catálogo llegue tarde o se modifique la noche anterior sin
requerir un despliegue (RF-130, RF-131).

`definicion` acepta dos formas: la plana original (`{ campos: [...] }`) y una agrupada
(`{ subsecciones: [{ titulo, campos: [...] }] }`), usada para dividir Historia clínica en
bloques con nombre (Motivo de consulta, Antecedentes heredofamiliares, etc.) sin perder
retrocompatibilidad — ambas siguen guardando un único blob `datos JSONB` por sección en
`expediente_seccion`, agrupar es solo cuestión de renderizado.

### 1.4 El dictamen es su propia tabla

Aunque conceptualmente es la quinta sección de captura, `dictamen_etapa1` es una tabla aparte
porque: lo llena un rol distinto (el médico, no el capturista), dispara la asignación de folio
(RF-144), y requiere evidencia de autoría (RNF-03).

### 1.5 Toda tabla audit-ada tiene `id` propio

`paciente_responsable` y `expediente_seccion` son conceptualmente relaciones
de clave compuesta (`paciente_id + responsable_id`, `expediente_id + seccion`).
Aun así llevan un `id uuid` propio como llave primaria, con la clave
compuesta como `unique`. Es lo que permite que el trigger genérico de
auditoría (§1.6) sea genérico de verdad: siempre puede leer `NEW.id` /
`OLD.id` sin un caso especial por tabla.

### 1.6 Auditoría por trigger, no por código

`audit_log` se escribe desde **triggers de PostgreSQL**, no desde la aplicación. Un desarrollador
distraído no puede olvidarla y una ruta nueva no puede saltársela. Cubre RNF-01, el requisito de
registros de auditoría de la NOM-004 y arranca el reloj de madurez para SIRES (RF-406).

### 1.7 Borrado lógico

No hay `DELETE`. Las bajas marcan `activo = false` y quedan en el log con su valor anterior
(RNF-02). Es exigencia de la NOM-004, que prohíbe borrar o enmendar: las correcciones deben
preservar el original. `documento` adoptó el mismo patrón para poder "eliminar" una foto del
paciente: la fila se marca `activo = false` (solo médico de triage o administrativo, vía RLS),
nunca se borra de verdad.

---

## 2. Esquema

### Núcleo

```sql
-- Edición de la campaña. Dos por año, con duración variable (RN-11).
jornada (
  id, clave, nombre, sede,
  fecha_inicio_etapa1, fecha_fin_etapa1, fecha_etapa2,
  estado                              -- planeada | etapa1 | etapa2 | cerrada
)

-- Identidad única. Pacientes y responsables (§1.1).
persona (
  id, curp,                           -- único cuando existe; opcional
  nombre, apellido_paterno, apellido_materno,
  fecha_nacimiento, sexo,
  telefono, telefono_alterno,
  estado, municipio, localidad, direccion,
  nombre_normalizado,                 -- índice trigram para búsqueda difusa
  activo
)

paciente_responsable (
  paciente_id, responsable_id,
  parentesco, es_principal
)

-- Un expediente por paciente por jornada (RN-02).
expediente (
  id, paciente_id, jornada_id,
  estado,                             -- borrador | completo | dictaminado
  creado_por, activo
)

-- Secciones de contenido variable, definidas por catálogo (§1.3).
expediente_seccion (
  expediente_id,
  seccion,                            -- antecedentes | socioeconomico
  datos JSONB, completa
)
```

### Dictamen y folio

```sql
-- Vocabulario cerrado, configurable por jornada (RN-12, RF-145).
dictamen_etapa1 (
  expediente_id, medico_id,
  resultado,                          -- apto_cirugia | apto_laser | no_apto
                                      -- regresar_6_meses | cirugia_guanajuato
                                      -- cirugia_leon (el enum crece cuando
                                      -- una edición necesita una salida nueva)
  observaciones, recomendacion,       -- recomendación de canalización (RF-142)
  fecha, firma_archivo_path
)

-- Solo existe si el dictamen fue apto (RN-05).
folio (
  id, expediente_id, jornada_id,
  servicio,                           -- cirugia | laser
  sede,                               -- 'general' | 'gto' | 'leon' — serie propia
                                      -- de folio cuando cirugía se divide por sede
  consecutivo, folio_texto, digito_verificador,
  UNIQUE (jornada_id, servicio, sede, consecutivo)
)
```

**Formato:** `NA-2026B-C-0147` → programa · jornada · servicio (C/L) · consecutivo, más dígito
verificador. Cuando la jornada divide cirugía por sede, se inserta un segmento más:
`NA-2026B-C-GTO-0147`. El QR codifica la cadena completa. La asignación es transaccional sobre
un contador por jornada, servicio y sede, de modo que varios capturistas simultáneos no generen
colisiones ni huecos (RF-151). `sede` es `NOT NULL` con el sentinela `'general'` — nunca `NULL`,
porque una columna en `NULL` no "empata" para el `UNIQUE`/`ON CONFLICT` que hace atómico el
contador.

### Documentos

```sql
consentimiento (
  expediente_id,
  tipo,                               -- aviso_privacidad | deslinde
                                      -- uso_imagen | consentimiento_informado
  archivo_path, firmado_en, capturado_por
)

documento (
  expediente_id,
  tipo,                               -- acta | curp | ine_responsable | comprobante_domicilio
                                      -- estudio_previo | foto_paciente
  vista_foto,                         -- anterior | lateral_derecha | lateral_izquierda
                                      -- (solo aplica si tipo = foto_paciente; nullable)
  archivo_path, subido_por, activo    -- activo: borrado lógico, "eliminar" una foto (§1.7)
)
```

Los cuatro tipos de consentimiento incluyen la **carta de consentimiento informado**, exigida
por NOM-004 §10.1 para cirugía mayor, con firma de dos testigos. Se firma en Etapa 2 (RF-221).

### Acceso, catálogo y auditoría

```sql
usuario_perfil (
  id → auth.users,
  nombre, rol,                        -- capturista | informista | administrativo
                                      -- medico_triage | (Etapa 2: primer_contacto,
                                      --   autorizador, evaluador_prequirurgico, programador)
  estado,                             -- pendiente | activo | suspendido
  aprobado_por, aprobado_en
)

catalogo_campos (
  jornada_id, seccion,
  definicion JSONB,                   -- { campos: [...] } o { subsecciones: [{ titulo, campos }] }
  version                             -- versionado por jornada (RF-132)
)

-- Mismo patrón que catalogo_campos, sin `seccion`: un solo catálogo de
-- salidas de dictamen por jornada (RF-145). Sin fila vigente, la
-- aplicación usa las 4 salidas originales como default.
catalogo_dictamen (
  jornada_id,
  definicion JSONB,                   -- { opciones: [{ resultado, etiqueta, descripcion? }] }
  version
)

audit_log (
  tabla, registro_id, accion,
  usuario_id, ts,
  datos_antes JSONB, datos_despues JSONB
)

pre_registro (                        -- buffer público, no crea expediente (RF-181)
  id, datos JSONB,
  estado,                             -- nuevo | validado | descartado
  expediente_id
)
```

Un usuario nuevo entra como `pendiente` **sin rol**, y las políticas de RLS le niegan todo hasta
que un administrativo lo apruebe (RN-10, RF-101).

---

## 3. Deduplicación

Crítica: la asociación lleva ~40 años atendiendo pacientes que **regresan cada seis meses**. Sin
esto, la segunda jornada digitalizada arranca con el padrón contaminado.

**Estrategia en cascada**, antes de permitir crear una persona nueva:

1. **CURP exacta** → coincidencia definitiva.
2. **Nombre difuso + fecha de nacimiento + sexo** → usando `pg_trgm`, tolera errores de
   ortografía y orden de apellidos.
3. **Teléfono** → detecta familias completas y responsables recurrentes.

Si hay candidatos, la interfaz **obliga a elegir** entre reutilizar o crear nueva; no permite
seguir de largo (RF-111). Al reutilizar, muestra el historial de expedientes y dictámenes
previos (RF-113).

---

## 4. Índices previstos

| Tabla | Índice | Para |
|---|---|---|
| `persona` | `gin (nombre_normalizado gin_trgm_ops)` | Búsqueda difusa por nombre |
| `persona` | `unique (curp) where curp is not null` | Unicidad cuando la CURP existe |
| `persona` | `(telefono)` | Búsqueda por teléfono |
| `persona` | `(fecha_nacimiento, sexo)` | Segundo filtro de deduplicación |
| `expediente` | `(jornada_id, estado)` | Listados y tableros del día |
| `expediente` | `(paciente_id)` | Historial del paciente |
| `folio` | `unique (jornada_id, servicio, consecutivo)` | Unicidad del folio (RN-06) |
| `folio` | `unique (folio_texto)` | Escaneo de QR |
| `audit_log` | `(tabla, registro_id, ts desc)` | Consulta de última modificación (RF-127) |

---

## 5. Retención

La NOM-004 exige conservar **mínimo 5 años desde el último acto médico**, garantizando
integridad, autenticidad y disponibilidad (RNF-04). En la práctica:

- Ningún expediente se purga automáticamente.
- Los respaldos diarios se conservan conforme a esa ventana.
- Para pacientes menores de edad conviene extender el plazo; **queda pendiente de definir con el
  asesor legal** el criterio exacto.

---

## 6. Pendientes del modelo

| Pendiente | Etapa |
|---|---|
| Catálogo de tipos de cirugía con duración estimada | 2 |
| Tablas de quirófano, bloque horario y programación | 2 |
| Tablas de encuesta y respuestas | 3 |
| Mapeo a catálogos oficiales CLUES y CIE-10 | 4 |
