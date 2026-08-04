# Requerimientos y etapas

**Programa Nuevo Amanecer, A.C. — Sistema de gestión de jornadas**
Versión 1.0 · 27 de julio de 2026

---

## 1. Propósito

Este documento enumera de forma trazable **qué debe hacer el sistema**, agrupado por etapa y
priorizado. Cada requerimiento tiene un identificador estable; las pantallas, migraciones y
pruebas deben poder apuntar a él.

Nomenclatura:

| Prefijo | Significado |
|---|---|
| `RN-xx` | Regla de negocio — invariante que el sistema debe respetar siempre |
| `RF-1xx` | Requerimiento funcional de Etapa 1 |
| `RF-15x` | Requerimiento funcional de Etapa 1.5 |
| `RF-2xx` | Requerimiento funcional de Etapa 2 |
| `RF-3xx` | Requerimiento funcional de Etapa 3 |
| `RF-4xx` | Requerimiento funcional de Etapa 4 |
| `RNF-xx` | Requerimiento no funcional — transversal a todas las etapas |

Prioridades: **Crítico** (sin esto no hay jornada) · **Alto** · **Medio** · **Bajo**.

---

## 2. Glosario

| Término | Definición |
|---|---|
| **Jornada** | Edición de la campaña. Ocurre dos veces al año, con duración variable. |
| **Primera revisión** | Etapa 1. Semana de citas donde un médico general hace el triage. |
| **Segunda revisión** | Etapa 2. Un día antes de las cirugías, ~mes y medio después de la primera. |
| **Servicio** | Uno de dos: **cirugía** (reconstructiva, funcional) o **láser** (estético, correctivo). |
| **Expediente** | Conjunto de datos de un paciente dentro de una jornada específica. |
| **Folio** | Identificador único que se entrega físicamente al candidato aprobado en Etapa 1. |
| **Dictamen** | Resolución del médico general en Etapa 1. |
| **Autorización** | Resolución del médico especialista en Etapa 2. |
| **Adulto responsable** | Familiar o amigo que responde por el paciente. Obligatorio siempre. |
| **Capturista** | Personal de la A.C. que registra datos. |
| **Autorizador** | Médico especialista que aprueba o rechaza la cirugía en Etapa 2. |

---

## 3. Actores

### Etapa 1

| Rol | Puede |
|---|---|
| **Capturista** | Crear y editar expedientes, subir documentos, imprimir folios |
| **Informista** | Solo consultar. Ninguna escritura. |
| **Administrativo** | Todo lo anterior + aprobar usuarios, asignar roles, gestionar catálogos y exportar |
| **Médico de triage** | Registrar su dictamen sobre los expedientes que atiende |
| **Público** | Pre-registrarse desde la landing, sin acceso a ningún dato |

### Etapa 2 (se suman)

| Rol | Puede |
|---|---|
| **Primer contacto** | Residentes médicos. Completan la papelería del hospital y preparan el caso. |
| **Autorizador** | Médico especialista. Resuelve si procede la cirugía y bajo qué condiciones. |
| **Evaluador prequirúrgico** | Registra el resultado de la evaluación prequirúrgica (sí / no). |
| **Programador** | Configura quirófanos disponibles y asigna pacientes a quirófano y horario. |

---

## 4. Reglas de negocio

| ID | Regla |
|---|---|
| **RN-01** | Un paciente es **único** en el sistema. Se identifica por CURP cuando existe; si no, por nombre + fecha de nacimiento + sexo. |
| **RN-02** | Un paciente puede tener **uno o varios expedientes**. Un expediente pertenece a exactamente un paciente y a exactamente una jornada. |
| **RN-03** | Todo paciente debe tener **al menos un adulto responsable**, aunque el paciente sea mayor de edad. |
| **RN-04** | La jornada ofrece exactamente **dos servicios**: cirugía y láser. Cirugía puede subdividirse por **sede** (p. ej. Guanajuato/León) sin que eso agregue un tercer servicio. |
| **RN-05** | El **folio se asigna únicamente** cuando el dictamen de Etapa 1 resulta apto, sea para cirugía o para láser. |
| **RN-06** | El folio es **único e irrepetible dentro de una jornada** e indica a qué servicio corresponde — y, cuando la jornada divide cirugía por sede, a qué sede. |
| **RN-07** | **Nadie sin folio de Etapa 1 puede ser programado para cirugía** en Etapa 2. Puede pasar a revisión, pero eso queda fuera del sistema. |
| **RN-08** | **Ningún registro se elimina físicamente.** El borrado es lógico. |
| **RN-09** | **Toda modificación queda registrada** con usuario, momento y valores anterior y posterior. |
| **RN-10** | Un usuario **sin aprobación explícita no tiene acceso a ningún dato**. |
| **RN-11** | Las jornadas ocurren **dos veces al año**, pero los plazos pueden acortarse o alargarse. |
| **RN-12** | El dictamen de Etapa 1 se registra dentro de un **vocabulario cerrado de salidas posibles** (no texto libre), configurable por jornada (RF-145). Por defecto son cuatro: apto para cirugía · apto para láser · no apto con recomendación · regresar en 6 meses. |
| **RN-13** | La autorización de Etapa 2 tiene **exactamente tres salidas**: apto para cirugía · reasignar a láser · regresar en 6 meses. |
| **RN-14** | Los datos de salud son **datos personales sensibles**: requieren consentimiento expreso y por escrito, otorgado por el padre o tutor cuando el paciente es menor. |
| **RN-15** | La información se conserva **un mínimo de 5 años** desde el último acto médico. |

---

## 5. Etapa 1 — Primera revisión

> **Cuándo:** desarrollo 27 jul – 2 ago 2026 · evento 3 al 7 de agosto de 2026, Guanajuato.
> **Meta:** que la semana de revisión opere sobre el sistema en lugar de papel.

### 5.1 Usuarios y control de acceso

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-101** | Cualquier persona puede registrarse; queda en estado `pendiente`, **sin rol y sin acceso a dato alguno**. | Crítico |
| **RF-102** | El administrativo ve los registros pendientes y **aprueba o rechaza**, asignando rol. | Crítico |
| **RF-103** | El administrativo puede **suspender** a un usuario activo, revocando su acceso de inmediato. | Alto |
| **RF-104** | Los permisos se aplican **en la base de datos** (RLS), no solo en la interfaz. | Crítico |

### 5.2 Personas y deduplicación

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-110** | Antes de crear una persona, el sistema **busca coincidencias** por CURP, por nombre aproximado + fecha de nacimiento, o por teléfono. | Crítico |
| **RF-111** | Si hay coincidencias probables, el capturista debe **elegir explícitamente** entre reutilizar la persona existente o crear una nueva. | Crítico |
| **RF-112** | Una misma persona puede figurar como **paciente en un expediente y como responsable en otro**, sin duplicarse. | Alto |
| **RF-113** | Al reutilizar un paciente de una jornada anterior, el sistema muestra su **historial de expedientes y dictámenes previos**. | Alto |

### 5.3 Expedientes y captura

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-120** | Crear un expediente ligado a **un paciente y una jornada**. | Crítico |
| **RF-121** | La captura se organiza en **cinco secciones**: paciente · adulto responsable · antecedentes médicos · estudio socioeconómico · dictamen del médico. | Crítico |
| **RF-122** | Permitir **guardado parcial**: el expediente se conserva incompleto y se puede retomar después. | Crítico |
| **RF-123** | **Autoguardado** periódico para no perder trabajo ante un cierre accidental. | Alto |
| **RF-124** | Marcar el expediente como `completo` solo cuando las secciones obligatorias están llenas. | Alto |
| **RF-125** | Registrar el **parentesco** entre paciente y adulto responsable. | Alto |
| **RF-126** | Capturar **teléfono celular** del responsable o del paciente, validado, para comunicación posterior. | Crítico |
| **RF-127** | Consultar **cuál fue la última carga o modificación** de un expediente, con fecha y autor. | Crítico |
| **RF-128** | Permitir **modificar** un expediente en jornadas posteriores, dejando registro de la modificación y de quién la hizo. | Crítico |

### 5.4 Catálogo de campos

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-130** | Las secciones de antecedentes médicos y estudio socioeconómico se definen por **catálogo configurable**, no por código. | Crítico |
| **RF-131** | El administrativo puede **modificar el catálogo sin requerir un nuevo despliegue**. | Alto |
| **RF-132** | El catálogo se **versiona por jornada**, para que los datos históricos conserven el significado con que fueron capturados. | Alto |

### 5.5 Dictamen del médico

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-140** | El médico registra su dictamen eligiendo entre las **salidas configuradas para la jornada** (RN-12). | Crítico |
| **RF-141** | El dictamen queda ligado al **médico que lo emitió y al momento** en que lo hizo. | Crítico |
| **RF-142** | En "no apto", capturar la **recomendación** de canalización a rehabilitación o reinserción social. | Alto |
| **RF-143** | En "regresar en 6 meses", dejar constancia para que el caso aparezca en la **siguiente jornada**. | Alto |
| **RF-144** | El dictamen apto **dispara automáticamente** la asignación de folio. | Crítico |
| **RF-145** | Las **salidas del dictamen y su etiqueta son configurables por jornada**, sin desplegar código — mismo mecanismo de catálogo versionado que RF-130/131/132. Sin catálogo propio, la jornada usa las cuatro salidas originales. | Alto |

### 5.6 Folio

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-150** | Generar un folio **único por jornada**, que identifique el servicio asignado (RN-06). | Crítico |
| **RF-151** | La asignación es **transaccional**: sin colisiones ni huecos con varios capturistas trabajando a la vez. | Crítico |
| **RF-152** | El folio incluye **dígito verificador** para detectar errores de tecleo. | Medio |
| **RF-153** | Generar un **código QR** que codifique el folio, legible por cámara o lector. | Crítico |
| **RF-154** | Imprimir el folio en **ticket térmico** (58 mm). | Alto |
| **RF-155** | Imprimir el folio en **hoja carta**, como respaldo si no hay impresora térmica. | Crítico |
| **RF-156** | El impreso incluye folio, nombre del paciente, servicio asignado y **fecha y sede de la segunda revisión**. | Alto |

### 5.7 Papelería y documentos

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-160** | Generar **PDF prellenado** con los datos del paciente para: aviso de privacidad, deslinde de responsabilidades y permiso de uso de imagen. | Crítico |
| **RF-161** | Subir la **foto o escaneo del documento firmado** y ligarlo al expediente. | Crítico |
| **RF-162** | **Comprimir la imagen en el navegador** antes de subirla, para controlar el almacenamiento. | Alto |
| **RF-163** | Mostrar el **estado de la papelería** por expediente: qué falta y qué está completo. | Alto |
| **RF-164** | Subir documentación de soporte: acta de nacimiento, CURP, INE del responsable, comprobante de domicilio, estudios previos. | Medio |
| **RF-165** | Los archivos se almacenan en **buckets privados**, accesibles solo por URL firmada de corta duración. | Crítico |

### 5.8 Landing pública v1

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-170** | Página de inicio con **qué es el programa** y la convocatoria de la jornada (sede y fechas). | Alto |
| **RF-171** | Publicar el **aviso de privacidad integral**, accesible sin sesión. *Obligación legal.* | Crítico |
| **RF-172** | Sección de contacto. | Medio |
| **RF-173** | Marcadores de posición para integrantes, patrocinadores e informes anuales (se completan en Etapa 3). | Bajo |

### 5.9 Pre-registro público

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-180** | Formulario público donde el interesado deja sus datos antes de asistir. | Alto |
| **RF-181** | El pre-registro **no crea un expediente**: queda en una bandeja separada hasta que un capturista lo valida y promueve. | Crítico |
| **RF-182** | Limitar la frecuencia de envío para contener el abuso. | Alto |
| **RF-183** | El formulario público muestra y requiere aceptar el aviso de privacidad. | Crítico |

### 5.10 Administración y respaldo

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-190** | Listado de expedientes con **filtros** por estado, servicio, dictamen y fecha. | Alto |
| **RF-191** | **Exportar a Excel/CSV** el padrón de la jornada. | Alto |
| **RF-192** | Tablero con conteos del día: atendidos, aptos para cirugía, aptos para láser, no aptos. | Medio |
| **RF-193** | **Importar CSV** para cargar lo capturado en papel bajo contingencia. | Crítico |
| **RF-194** | **Respaldo diario automático** y descarga manual al cierre de cada día. | Crítico |

---

## 6. Etapa 1.5 — Consolidación

> **Cuándo:** agosto de 2026, después del evento.

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-1501** | Enviar el folio en formato digital al celular registrado. | Alto |
| **RF-1502** | Bot de comunicación automatizada por WhatsApp: confirmación y **recordatorio de la cita de Etapa 2**. | Alto |
| **RF-1503** | Conciliar e importar lo capturado en papel; detectar y fusionar duplicados. | Alto |
| **RF-1504** | **Modo sin conexión**: capturar localmente y sincronizar al recuperar red. | Alto |
| **RF-1505** | Evaluar servidor local en laptop para sedes con red limitada. | Medio |
| **RF-1506** | Reportes de Etapa 1 por servicio, región de origen y diagnóstico. | Medio |

---

## 7. Etapa 2 — Segunda revisión y día quirúrgico

> **Cuándo:** entrega ~3ª semana de septiembre de 2026, un día antes de las cirugías.
> El folio de Etapa 1 es la llave de entrada a todo este flujo.

### 7.1 Recepción

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-201** | **Registrar asistencia escaneando el QR** del folio. | Crítico |
| **RF-202** | Al escanear, **precargar toda la información** capturada en Etapa 1. | Crítico |
| **RF-203** | Reportar qué folios **asistieron y cuáles no**, en tiempo real. | Alto |
| **RF-204** | Verificar que el asistente traiga la **documentación completa** requerida. | Alto |

### 7.2 Ruta láser

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-210** | Generar la **lista previa** de todos los folios asignados a láser. | Crítico |
| **RF-211** | **Pantalla pública de llamado** que indique qué folios pasan al área de preparación. | Alto |
| **RF-212** | Registrar la atención concluida y **disparar la encuesta** de satisfacción. | Medio |

### 7.3 Ruta cirugía

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-220** | **Primer contacto:** checklist de la papelería que exige el hospital receptor, marcando faltantes. | Crítico |
| **RF-221** | Generar y registrar la **carta de consentimiento informado**, con firma del paciente o tutor y **dos testigos**. *Exigencia NOM-004 §10.1.* | Crítico |
| **RF-222** | Un caso solo pasa al autorizador cuando **la papelería está completa**. | Alto |
| **RF-223** | **Autorizador:** registrar la resolución con las tres salidas de RN-13. | Crítico |
| **RF-224** | Al autorizar, capturar **qué cirugía** se aprueba y **bajo qué condiciones**. | Crítico |
| **RF-225** | La resolución queda ligada al **autorizador y al momento** exacto. | Crítico |
| **RF-226** | Si se reasigna a láser, el caso **pasa a la ruta de láser** conservando su historial. | Alto |
| **RF-227** | **Evaluación prequirúrgica:** registrar resultado como sí o no. | Crítico |
| **RF-228** | El programador ve, por paciente: **quién atendió** en primer contacto, **qué autorizador** aprobó y cuándo, **qué cirugía** y con qué condiciones, y **si pasó** la prequirúrgica. | Crítico |
| **RF-229** | La información de cada etapa **permanece disponible** hasta que concluyan todas las etapas de la jornada. | Alto |

### 7.4 Programación de quirófanos

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-240** | El programador define **cuántos quirófanos hay disponibles** al inicio del ejercicio. | Crítico |
| **RF-241** | Solo se pueden programar pacientes con **las tres aprobaciones** (primer contacto, autorizador, prequirúrgica). | Crítico |
| **RF-242** | Cada tipo de cirugía tiene una **duración estimada precargada**. | Alto |
| **RF-243** | El programador puede **modificar la duración** de cualquier caso concreto. | Crítico |
| **RF-244** | Asignar quirófano y bloque horario, **distribuido a lo largo de varios días**. | Crítico |
| **RF-245** | **Vista de agenda** por quirófano y por día, con ocupación y huecos visibles. | Alto |
| **RF-246** | Advertir sobre **empalmes o sobrecupo** al asignar. | Alto |

---

## 8. Etapa 3 — Encuestas, portal e informes

> **Cuándo:** octubre – noviembre de 2026.

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-301** | Encuestas de satisfacción **ligadas al folio** del paciente atendido. | Alto |
| **RF-302** | Entrega de la encuesta por QR o liga al concluir la atención. | Alto |
| **RF-303** | Tablero de resultados de encuestas por jornada y por servicio. | Medio |
| **RF-304** | Landing completa: **integrantes, patrocinadores e informes anuales** históricos. | Medio |
| **RF-305** | El contenido de la landing es **editable sin desplegar código** (se actualiza una vez al año). | Medio |
| **RF-306** | Tablero de indicadores para el informe anual de la asociación. | Medio |
| **RF-307** | **Documentación normativa completa** en `CUMPLIMIENTO.md`, con una ficha por norma: qué dice · cómo nos aplica · cumplimiento mínimo viable · cumplimiento ideal · estado actual y brecha. | Alto |

---

## 9. Etapa 4 — Certificación SIRES (NOM-024)

> **Cuándo:** ~1er trimestre de 2027.

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-401** | Cerrar la brecha identificada en la documentación normativa de Etapa 3. | Alto |
| **RF-402** | Identificar las **Guías de Intercambio de Información en Salud (GIIS)** aplicables. | Alto |
| **RF-403** | Adoptar catálogos oficiales: **CLUES, CIE-10**. | Alto |
| **RF-404** | Solicitar y administrar el **registro de OID**. | Alto |
| **RF-405** | Implementar interoperabilidad conforme al marco técnico (**HL7 CDA R2 / V3, PIX V3**) en los escenarios aplicables. | Alto |
| **RF-406** | Acreditar los **6 meses de madurez** del sistema de seguridad de la información. | Crítico |
| **RF-407** | Obtener el **Dictamen de Verificación Satisfactorio** ante DGIS u organismo acreditado. | Alto |

> **Decisión pendiente para esta etapa:** certificar el sistema completo o únicamente el módulo
> que efectivamente intercambia información en salud. Menos superficie certificada es más
> barato y más rápido.

---

## 10. Requerimientos no funcionales

### Trazabilidad y cumplimiento

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RNF-01** | Toda modificación se registra automáticamente **a nivel de base de datos**, con usuario, momento y valores antes y después. | Crítico |
| **RNF-02** | **No existe borrado físico.** Las bajas son lógicas y reversibles por un administrativo. | Crítico |
| **RNF-03** | El dictamen médico y la autorización quirúrgica conservan **evidencia de autoría** (firma autógrafa digitalizada o su equivalente). | Alto |
| **RNF-04** | La información se conserva **mínimo 5 años** desde el último acto médico, con integridad, autenticidad y disponibilidad. | Alto |

### Seguridad y privacidad

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RNF-10** | Control de acceso aplicado por **Row Level Security**, no solo en la interfaz. | Crítico |
| **RNF-11** | Los archivos viven en **almacenamiento privado**, servidos por URL firmada de corta duración. | Crítico |
| **RNF-12** | Ningún dato personal real entra al repositorio; los datos de prueba son **sintéticos**. | Crítico |
| **RNF-13** | Guardia **pre-commit** que rechaza patrones de CURP, RFC y teléfonos de 10 dígitos. | Alto |
| **RNF-14** | La transferencia internacional de datos (alojamiento fuera de México) se **declara en el aviso de privacidad**. | Crítico |

### Operación

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RNF-20** | Soportar **5 capturistas concurrentes** sin degradación perceptible. | Crítico |
| **RNF-21** | Un expediente completo debe capturarse en **6–8 minutos** o menos. | Crítico |
| **RNF-22** | Interfaz utilizable en **laptop y tableta**. | Alto |
| **RNF-23** | Existe un **formato en papel idéntico** al digital como contingencia. | Crítico |
| **RNF-24** | Respaldo **diario automático**, con descarga manual verificable. | Crítico |
| **RNF-25** | Interfaz íntegramente en **español de México**. | Crítico |

---

## 11. Fuera de alcance

Explícitamente **no** forman parte de este sistema:

- El expediente clínico oficial de las cirugías, que corresponde al hospital receptor.
- Las revisiones de pacientes que llegan a la Etapa 2 **sin folio** de la Etapa 1.
- Facturación, contabilidad y gestión de donativos.
- Inventario de medicamentos e insumos.
- Gestión de la agenda y logística de los médicos voluntarios.

Estos temas pueden incorporarse en etapas futuras si la asociación lo decide, pero hoy no
están considerados y no deben asumirse.

---

## 12. Historial

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 27 jul 2026 | Versión inicial, derivada del levantamiento con la asociación. |
