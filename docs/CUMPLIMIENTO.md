# Cumplimiento normativo

**Programa Nuevo Amanecer, A.C.**
Versión 1.0 (parcial) · 27 de julio de 2026

> ⚠ **Estado del documento.** Esta es la **versión 1**, elaborada durante la Etapa 1 para no
> operar a ciegas. La **versión completa es un entregable de la Etapa 3** (RF-307), donde cada
> norma se documenta con la estructura: qué dice · cómo nos aplica · cumplimiento mínimo viable
> · cumplimiento ideal · estado actual y brecha.
>
> ⚠ **Este documento no es asesoría legal.** Fue elaborado por el equipo técnico a partir de
> fuentes públicas. **Debe ser revisado y validado por el asesor legal de la asociación**,
> especialmente en lo relativo a los documentos que firman los pacientes.

---

## 1. Posicionamiento del sistema

**Decisión fundamental, que determina toda la carga regulatoria:**

> Durante las Etapas 1 a 3, este sistema es de **gestión administrativa de la jornada** —
> preselección de candidatos, folios, logística, papelería y programación de quirófanos.
> **No es un expediente clínico electrónico.** El expediente clínico oficial de las cirugías es
> y sigue siendo el del hospital receptor, como ha ocurrido siempre.

Esto evita asumir hoy las obligaciones de un SIRES certificado, que implicarían un proyecto de
otra magnitud. Aun así, el sistema se construye **con las buenas prácticas de la NOM-004**
(auditoría, no borrado, retención, evidencia de autoría), porque son correctas por sí mismas y
porque son el prerrequisito de la certificación de la Etapa 4.

**La Etapa 4 cambia este posicionamiento de forma deliberada**, cuando la asociación decida
certificarse como SIRES.

> Este posicionamiento debe ser **confirmado por escrito por el asesor legal**. Es el supuesto
> sobre el que descansa el alcance de las primeras tres etapas.

---

## 2. Normas aplicables — versión 1

### 2.1 NOM-004-SSA3-2012 — Del expediente clínico

**Qué dice.** Establece los criterios para elaborar, integrar, usar, manejar, archivar,
conservar y proteger el expediente clínico. Aplica a **todos los establecimientos para la
atención médica de los sectores público, social y privado**.

**Cómo nos aplica.** La asociación presta atención médica; le aplica. Aunque el expediente
oficial lo lleve el hospital, los datos que capturamos son antecedentes clínicos y dictámenes
médicos. Obligaciones que sí caen sobre este sistema:

| Requisito | Implementación |
|---|---|
| Conservación mínima **5 años** desde el último acto médico | Sin purga automática; respaldos con esa ventana (RNF-04) |
| Integridad, autenticidad y disponibilidad durante ese plazo | Respaldos verificados, RLS, almacenamiento privado |
| **Registros de auditoría** | `audit_log` por trigger de PostgreSQL (RNF-01) |
| **Firma que acredite autoría y momento** de cada nota | Dictamen impreso y firmado, digitalizado al expediente (RNF-03) |
| **No borrar ni enmendar**; las correcciones preservan el original | Borrado lógico; `datos_antes` en el log (RNF-02) |
| **Carta de consentimiento informado** para cirugía mayor y anestesia general o regional, **con dos testigos** (§10.1.1.10) | RF-221, en Etapa 2 |

**Hallazgo relevante.** Los tres documentos contemplados originalmente por la asociación —aviso
de privacidad, deslinde de responsabilidades y uso de imagen— **no incluyen la carta de
consentimiento informado, y el deslinde no la sustituye**: son figuras jurídicas distintas. Son
**cuatro** documentos.

**Cumplimiento mínimo viable.** Auditoría, no-borrado, retención y consentimiento informado con
dos testigos. Todo contemplado en el alcance actual.

**Cumplimiento ideal.** Firma electrónica avanzada en lugar de digitalización de firma
autógrafa. *Por evaluar en Etapa 3.*

---

### 2.2 NOM-024-SSA3-2012 — Sistemas de información de registro electrónico para la salud

**Qué dice.** Regula los **SIRES** y los mecanismos para que los prestadores de servicios de
salud registren, intercambien y consoliden información. Define un marco técnico de
interoperabilidad, guías de intercambio (**GIIS**), catálogos obligatorios y requisitos de
seguridad.

**Cómo nos aplica.** **Hoy no aplica**, por el posicionamiento de la sección 1. Aplicará cuando
la asociación decida certificarse (Etapa 4).

**Requisitos para certificar** (§7.5.2 y guía de la DGIS):

- Dictamen de Verificación Satisfactorio ante DGIS u organismo acreditado.
- Documentación técnica y cumplimiento de disposiciones legales aplicables.
- Identificar las **GIIS** aplicables al alcance del sistema.
- Catálogos oficiales: **CLUES**, **CIE-10**.
- Registro y manejo de **OID**.
- Interoperabilidad: **HL7 CDA R2, HL7 V3, PIX V3**.
- **El sistema de seguridad de la información debe tener un mínimo de 6 meses de madurez.**

**Consecuencia sobre la Etapa 1.** Ese último punto significa que el reloj arranca cuando los
controles de seguridad entran en operación, no cuando se decide certificar. La auditoría, el
RLS, el control de acceso y el no-borrado que se construyen en agosto de 2026 **son el arranque
del reloj**. Hacerlos mal obligaría a reiniciar el conteo.

**Decisión pendiente para la Etapa 4.** Certificar el sistema completo o solo el módulo que
efectivamente intercambia información en salud. Menos superficie certificada es más barato y
más rápido.

---

### 2.3 LFPDPPP — Ley Federal de Protección de Datos Personales en Posesión de los Particulares

**Qué dice.** Regula el tratamiento de datos personales por particulares. **La ley vigente entró
en vigor el 21 de marzo de 2025**, sustituyendo a la anterior. Con la reforma constitucional
previa **desapareció el INAI**, y sus funciones pasaron a la **Secretaría Anticorrupción y Buen
Gobierno**.

**Cómo nos aplica.** La asociación es responsable del tratamiento. Los datos de salud son
**datos personales sensibles**, lo que eleva las exigencias:

| Requisito | Implementación |
|---|---|
| **Consentimiento expreso y por escrito** para datos sensibles | Papelería firmada de forma autógrafa y digitalizada (RF-160, RF-161) |
| Consentimiento del **padre o tutor** cuando el titular es menor | Adulto responsable obligatorio (RN-03) |
| **Aviso de privacidad** integral, públicamente accesible | Publicado en la landing (RF-171), con apartado propio para colaboradores |
| Aviso de privacidad **simplificado** en el formato que se firma | En el PDF prellenado |
| Declarar la **transferencia internacional** de datos | El alojamiento está fuera de México; debe declararse (RNF-14) |
| Designar responsable de datos y habilitar derechos **ARCO** | *Pendiente con la asociación* |
| Medidas de seguridad | RLS, almacenamiento privado, auditoría, aislamiento del repositorio |

> ⚠ **Advertencia práctica.** Cualquier plantilla de aviso de privacidad anterior a marzo de
> 2025 —incluidas las que la asociación tenga archivadas y las que circulan en internet— **está
> desactualizada**. Los cuatro documentos deben redactarse contra la ley vigente y ser revisados
> por un abogado.

**Nota sobre alojamiento.** Supabase no ofrece región en México; los datos residirían en Estados
Unidos. Es legal siempre que la transferencia se declare en el aviso de privacidad. Si la
asociación prefiere residencia nacional, hay que evaluar alojamiento alternativo — decisión que
conviene tomar antes de la Etapa 4.

---

### 2.4 Otras normas — pendientes de documentar en Etapa 3

| Norma | Relevancia esperada |
|---|---|
| **Ley General de Salud**, art. 51 Bis — consentimiento informado | Fundamento legal de las cartas de consentimiento |
| **Reglamento de la LGS en Materia de Prestación de Servicios de Atención Médica**, arts. 80–83 | Requisitos de la carta de consentimiento bajo información |
| **CLUES** — Clave Única de Establecimientos de Salud | Requisito para NOM-024; identifica la unidad médica |
| Obligaciones de la A.C. como **donataria autorizada** | Informes y transparencia; alimenta los informes anuales de la landing |
| **NOM-005-SSA3-2018** — infraestructura de atención ambulatoria | Probablemente del establecimiento, no del software; confirmar |

---

## 3. Medidas técnicas ya comprometidas

| Medida | Requerimiento | Norma que atiende |
|---|---|---|
| Auditoría automática por trigger, con usuario, momento y valores antes/después | RNF-01 | NOM-004 · NOM-024 |
| **Auditoría de exportaciones**: quién descargó el padrón, cuándo, con qué filtros y cuántas filas | RF-191 | LFPDPPP · NOM-024 |
| Borrado lógico, nunca físico | RNF-02 | NOM-004 |
| Control de acceso por RLS en base de datos | RNF-10 | LFPDPPP · NOM-024 |
| Usuario sin aprobación no accede a ningún dato | RN-10, RF-101 | LFPDPPP |
| Archivos en almacenamiento privado con URL firmada | RNF-11, RF-165 | LFPDPPP |
| Ningún dato real en el repositorio; semillas sintéticas | RNF-12 | LFPDPPP |
| Guardia pre-commit contra CURP, RFC y teléfonos | RNF-13 | LFPDPPP |
| Retención mínima de 5 años | RNF-04 | NOM-004 |
| Evidencia de autoría del dictamen y la autorización | RNF-03 | NOM-004 |

---

## 4. Pendientes

| # | Pendiente | Responsable | Etapa |
|---|---|---|---|
| 1 | Redactar los cuatro documentos contra la ley vigente | Equipo técnico | ✅ 3 de 4 (día 6) · falta consentimiento informado, Etapa 2 |
| 2 | **Revisión jurídica de los tres documentos redactados** (aviso de privacidad, deslinde, uso de imagen) | Asesor legal de la A.C. | 1 · antes del evento |
| 3 | Confirmar por escrito el posicionamiento de la sección 1 | Asesor legal | 1 |
| 4 | Designar responsable de datos y canal para derechos ARCO | Asociación | 1.5 |
| 5 | Definir criterio de retención para menores de edad | Asesor legal | 1.5 |
| 6 | Decidir sobre residencia de datos en México | Asociación | 3 |
| 7 | **Documentación normativa completa** con la estructura de cinco campos | Equipo técnico | 3 (RF-307) |

---

## 5. Fuentes

- [NOM-004-SSA3-2012, Del expediente clínico — DOF](https://dof.gob.mx/nota_detalle.php?codigo=5272787&fecha=15%2F10%2F2012)
- [NOM-024-SSA3-2012 — DOF](https://dof.gob.mx/nota_detalle.php?codigo=5280847&fecha=30%2F11%2F2012)
- [Certificación NOM-024-SSA3-2012 — DGIS](http://www.dgis.salud.gob.mx/contenidos/intercambio/certificacion-nom-024-ssa3-2012.html)
- [Guía rápida del proceso de certificación — DGIS](http://www.dgis.salud.gob.mx/contenidos/intercambio/guias/guia_rapida_proceso_de_certificacion.pdf)
- [Guías de Intercambio de Información en Salud (GIIS) — DGIS](http://www.dgis.salud.gob.mx/contenidos/intercambio/iis_guias_gobmx.html)
- [Catálogos CLUES — DGIS](http://www.dgis.salud.gob.mx/contenidos/intercambio/clues_gobmx.html)
- [Cartas de consentimiento informado conforme a NOM-004 — FEMECOG](https://www.femecog.org.mx/docs/cartasconsentimiento.pdf)
- [Nueva LFPDPPP 2025 y desaparición del INAI — Garrigues](https://www.garrigues.com/es_ES/noticia/mexico-nueva-ley-federal-proteccion-datos-personales-posesion-particulares-introduce)
- [Entrada en vigor de la nueva LFPDPPP — EY México](https://www.ey.com/es_mx/technical/tax/boletines-fiscales/nueva-ley-federal-proteccion-datos-personal-posesion-particulares)
