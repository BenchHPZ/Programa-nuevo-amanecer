# Plan de desarrollo por etapas

**Programa Nuevo Amanecer, A.C. — Sistema de gestión de jornadas**
Versión 1.0 · 27 de julio de 2026

> El detalle de **qué** debe hacer el sistema está en [REQUERIMIENTOS.md](REQUERIMIENTOS.md).
> Este documento cubre **cuándo, en qué orden y por qué**.

---

## 1. Contexto

Programa Nuevo Amanecer es una asociación civil sin fines de lucro que desde hace ~35-40 años
realiza jornadas quirúrgicas gratuitas de labio y paladar hendido, dos veces al año. Convoca
médicos de todo el país que donan su tiempo, y la asociación gestiona medicamentos, insumos,
instalaciones, quirófanos y toda la administración de los pacientes.

El proceso completo ha operado en papel. Este proyecto lo digitaliza por primera vez.

**Restricción dominante:** la primera revisión de la jornada en curso es del **3 al 7 de agosto
de 2026 en Guanajuato**. Quedan 7 días de desarrollo (27 de julio – 2 de agosto). Todo el plan
se subordina a llegar a esa fecha con la captura funcionando.

---

## 2. Mapa de etapas

| Etapa | Qué entrega | Cuándo |
|---|---|---|
| **1** | Captura, triage, folio, landing v1 | 27 jul – 2 ago · evento 3–7 ago 2026 |
| **1.5** | Consolidación, WhatsApp, modo offline | agosto 2026 |
| **2** | Día quirúrgico: 4 roles + programación de quirófanos | ~3ª semana de septiembre 2026 |
| **3** | Encuestas, portal completo, informes, documentación normativa | octubre – noviembre 2026 |
| **4** | Certificación SIRES (NOM-024) | ~1er trimestre 2027 |

---

## 3. Parámetros confirmados

| Tema | Decisión |
|---|---|
| Sede y fechas 1ª revisión | Guanajuato · 3 al 7 de agosto de 2026 |
| Capturistas | 5 puestos simultáneos, inicialmente |
| Volumen esperado | 150–500 personas en la semana |
| Stack | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS) · Hosting Vercel |
| Conectividad | En línea. Modo offline y servidor local → Etapa 1.5 |
| Captura | Capturista en sitio + pre-registro público + médico captura su dictamen |
| Alta de usuarios | Auto-registro + aprobación y asignación de rol desde panel admin |
| Catálogo de campos | Se propone un catálogo base; la asociación lo valida |
| Folio físico | Ticket térmico + hoja carta (respaldo). Digital → Etapa 1.5 |
| Papelería | PDF prellenado → impreso → firma autógrafa → foto/escaneo al expediente |
| WhatsApp Business API | Trámite iniciado en paralelo desde la semana del 27 de julio |
| Datos sensibles | Aislados en carpeta excluida de git |

---

## 4. Hallazgos que definieron el alcance

### 4.1 NOM-004 aplica, y faltaba un documento

La **NOM-004-SSA3-2012 (Del expediente clínico)** aplica a establecimientos de los sectores
público, social **y privado** — la asociación incluida. De ahí salen tres restricciones de
diseño: conservación mínima de 5 años, firma que acredite autoría y momento de cada nota con
registros de auditoría, y prohibición de borrar o enmendar (las correcciones preservan el
original).

**El hallazgo:** el numeral 10.1 exige **carta de consentimiento informado** para cirugía
mayor, anestesia general o regional e ingreso hospitalario, **con nombre completo y firma de
dos testigos** (10.1.1.10). Los tres documentos originalmente contemplados —aviso de
privacidad, deslinde de responsabilidades y uso de imagen— **no lo incluyen, y el deslinde no
lo sustituye**: son figuras jurídicas distintas. Son **cuatro** documentos. Éste se firma en la
Etapa 2, cuando ya se sabe qué cirugía es (RF-221).

### 4.2 Certificación SIRES: meta a 6 meses, no ahora

La certificación NOM-024 la otorga la **DGIS** o un organismo acreditado y exige (§7.5.2)
Dictamen de Verificación Satisfactorio, documentación técnica e identificar las **GIIS**
aplicables, además de interoperabilidad (HL7 CDA R2, HL7 V3, PIX V3), catálogos oficiales
(CLUES, CIE-10) y registro de OID.

**El dato que fija el plazo:** la norma exige que el **sistema de seguridad de la información
tenga un mínimo de 6 meses de madurez** antes de certificar. El reloj arranca cuando los
controles entran en operación, no cuando se decide certificar.

Consecuencia sobre la Etapa 1: la auditoría, el RLS, el control de acceso y el no-borrado **no
son higiene opcional, son el arranque del reloj de certificación**. Hacerlos bien en agosto es
lo que hace viable certificar a principios de 2027; hacerlos mal reinicia el conteo.

**Mientras tanto** (Etapas 1 a 3), el sistema se posiciona como **gestión administrativa de la
jornada** y el expediente clínico oficial sigue siendo el del hospital receptor, como ya ocurre
hoy. Esto debe constar por escrito y ser validado por el asesor legal. La Etapa 4 cambia esa
posición de forma deliberada.

### 4.3 La ley de datos personales cambió en 2025

La **nueva LFPDPPP entró en vigor el 21 de marzo de 2025**: desapareció el INAI y sus funciones
pasaron a la **Secretaría Anticorrupción y Buen Gobierno**. Consecuencia práctica: **cualquier
plantilla de aviso de privacidad anterior a 2025 está desactualizada**, incluidas las que la
asociación tenga guardadas.

Los datos de salud son **datos personales sensibles** → consentimiento expreso y por escrito.
Como los pacientes son mayoritariamente menores, lo otorga el padre o tutor: de ahí que el
adulto responsable sea obligatorio (RN-03).

> Los cuatro documentos se redactan como parte del proyecto, pero **deben ser revisados por un
> abogado antes de usarse**. Un deslinde mal redactado no protege a la asociación, y el uso de
> imagen de un menor tiene requisitos propios.

### 4.4 WhatsApp no cabía en 7 días

La Business API exige verificación de Meta (documentos de la asociación, dominio y número), lo
que tarda de días a semanas y no depende del equipo. El trámite corre en paralelo desde la
semana del 27 de julio; esta jornada el folio se entrega impreso.

---

## 5. Arquitectura

```
Next.js (App Router, RSC)  ──►  Supabase PostgreSQL
   │                              ├── Row Level Security por rol
   ├── /  público                 ├── Triggers de auditoría (append-only)
   │    ├── landing v1            └── pg_trgm (búsqueda difusa de nombres)
   │    ├── pre-registro
   │    └── aviso de privacidad   Supabase Auth    → sesión + rol aprobado
   ├── /app  interno              Supabase Storage → privado, URL firmada
   │    ├── captura
   │    ├── dictamen (médico)
   │    └── admin
   └── /imprimir  plantillas
```

**Principios que sostienen las cuatro etapas:**

- **Una sola tabla `persona`.** El adulto responsable de hoy puede ser paciente mañana; dos
  hermanos comparten responsable. Separarlos genera duplicados desde el día uno.
- **Auditoría por trigger de PostgreSQL, no por código de aplicación.** Imposible de olvidar,
  imposible de saltar. Cubre la trazabilidad que pidió la asociación, el requisito de NOM-004
  y arranca el reloj de madurez para SIRES.
- **Borrado lógico, nunca físico.** Exigencia normativa, no preferencia.
- **Roles en tabla + RLS desde el día 1.** Los cuatro roles de la Etapa 2 se agregan como
  filas, no como refactor.
- **Secciones clínicas en JSONB definido por catálogo.** Los campos de identidad sí son
  columnas tipadas: se necesitan para buscar, deduplicar y reportar.

Detalle del esquema en [MODELO-DATOS.md](MODELO-DATOS.md).

---

## 6. Etapa 1 — Los 7 días (27 de julio → 2 de agosto)

| Día | Fecha | Entregable | Requerimientos |
|---|---|---|---|
| **1** | 27 jul | Documentación · repo con `.gitignore` endurecido y `privado/` · Next.js · Supabase · Auth con auto-registro y aprobación · RLS base · despliegue | RF-101…104 · RNF-12,13 |
| **2** | 28 jul | Esquema completo · triggers de auditoría · borrado lógico · deduplicación (pg_trgm) · semillas sintéticas | RF-110…113 · RNF-01,02,10 |
| **3** | 29 jul | Captura de paciente y responsable · guardado parcial y autoguardado | RF-120…128 |
| **4** | 30 jul | Motor de formularios por catálogo · secciones de antecedentes y socioeconómico | RF-130…132 |
| **5** | 31 jul | Pantalla del médico: dictamen con 4 salidas · asignación transaccional de folio + QR | RF-140…144 · RF-150…153 |
| **6** | 1 ago | Impresión (térmico + carta) · 3 consentimientos prellenados · subida de escaneos · landing v1 + pre-registro | RF-154…156 · RF-160…165 · RF-170…183 |
| **7** | 2 ago | Panel admin · exportación · endurecer RLS · **ensayo general** · capacitación · respaldos · contingencia impresa | RF-190…194 · RNF-20…24 |

### Fuera de alcance de estos 7 días

Bot de WhatsApp · Etapa 2 completa · encuestas · modo offline/PWA · firma digital en tablet ·
informes anuales en la landing.

### Plan de contingencia (no opcional)

1. Formato en papel impreso **idéntico** al formulario digital, para toda la semana.
2. Talonario de folios pre-impresos por si falla la asignación digital.
3. Importador CSV para capturar después lo levantado en papel (RF-193).
4. Respaldo automático diario + descarga manual al cierre de cada día (RF-194).

Siete días alcanzan para construir esto, no para endurecerlo. La contingencia convierte una
falla técnica en un inconveniente y no en un problema para 500 familias.

Detalle operativo en [OPERACION.md](OPERACION.md).

---

## 7. Etapas posteriores

### Etapa 1.5 — Consolidación (agosto 2026)

Cierre del trámite de WhatsApp Business API y bot de recordatorios · importación y conciliación
de lo capturado en papel · entrega digital del folio · modo offline con cola de sincronización
y evaluación de servidor local · reportes de la jornada.

### Etapa 2 — Día quirúrgico (~3ª semana de septiembre 2026)

```
Check-in (QR) ──► LÁSER: lista + pantalla de llamado + encuesta
              └─► CIRUGÍA:
                   Pantalla de llamado
                   Primer contacto (residentes)
                      checklist de papelería del hospital
                      + carta de consentimiento informado (2 testigos)
                        ▼
                   Autorizador (especialista) → 3 salidas:
                      · apto para cirugía  (registra CUÁL cirugía y condiciones)
                      · reasignar a láser
                      · regresar en 6 meses
                        ▼
                   Evaluación prequirúrgica  (sí / no)
                        ▼
                   Programador → asigna quirófano y bloque horario
                  
                   Encesuta posterior a fin de evento
```

Todo queda trazado: quién atendió en primer contacto, qué autorizador aprobó, a qué hora, qué
cirugía y bajo qué condiciones. El tablero de quirófanos permite configurar cuántos hay
disponibles, con duración estimada precargada por tipo de cirugía y siempre editable.

### Etapa 3 — Encuestas, portal e informes (octubre – noviembre 2026)

Encuestas ligadas al folio · landing completa con integrantes, patrocinadores e informes
anuales · tablero de indicadores · **documentación normativa completa**, con una ficha por norma
bajo la estructura: qué dice · cómo nos aplica · cumplimiento mínimo viable · cumplimiento ideal
· estado actual y brecha. Esa columna de brecha es el insumo directo de la Etapa 4.

### Etapa 4 — Certificación SIRES (~fin 1er trimestre 2027)

Cerrar la brecha · identificar GIIS aplicables · adoptar CLUES y CIE-10 · registro de OID ·
interoperabilidad HL7 · acreditar los 6 meses de madurez del sistema de seguridad · Dictamen
Satisfactorio ante DGIS u organismo acreditado.

---

## 8. Costos operativos estimados

| Concepto | Costo |
|---|---|
| Supabase Pro (100 GB, respaldos) | ~$25 USD/mes |
| Vercel | Gratis (el plan Hobby alcanza a este volumen) |
| Dominio | ~$15 USD/año |
| Impresora térmica (opcional) | $1,500–3,000 MXN, pago único |
| Certificación NOM-024 (Etapa 4) | Por cotizar con DGIS / organismo acreditado |

Almacenamiento estimado: 500 pacientes × 3 consentimientos + documentación ≈ 500 MB por jornada
con compresión en el navegador.

---

## 9. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El catálogo de campos llega tarde o cambia | Alto | Formularios por configuración: se editan sin desplegar (RF-130,131) |
| Falla técnica durante el evento | Crítico | Contingencia en papel + folios pre-impresos + importador CSV |
| La captura resulta más lenta de lo previsto | Alto | Ensayo cronometrado el 2 de agosto; si excede 8 min se simplifica antes del evento |
| Duplicación de pacientes recurrentes | Alto | Deduplicación obligatoria antes de crear persona (RF-110,111) |
| Red inestable en la sede | Medio | Modo offline en Etapa 1.5; contingencia en papel mientras tanto |
| Documentos legales sin revisión jurídica | Crítico | Contacto con asesor legal comprometido para el día 5 |

---

## 10. Pendientes de la asociación

| # | Pendiente | Cuándo |
|---|---|---|
| 1 | Validar el catálogo de campos base propuesto | Día 4 · 30 jul |
| 2 | Confirmar dirección exacta de la sede y horarios de atención | Día 3 · 29 jul |
| 3 | Iniciar trámite de WhatsApp Business API | ✔ acordado |
| 4 | Contacto del asesor legal para revisar los cuatro documentos | Día 5 · 31 jul |
| 5 | Confirmar si se compra impresora térmica o se usa hoja carta | Día 5 · 31 jul |
| 6 | Confirmar fecha exacta de la Etapa 2 | Antes del 7 de agosto |

---

## 11. Fuentes normativas consultadas

- [NOM-004-SSA3-2012, Del expediente clínico — DOF](https://dof.gob.mx/nota_detalle.php?codigo=5272787&fecha=15%2F10%2F2012)
- [NOM-024-SSA3-2012, Sistemas de información de registro electrónico para la salud — DOF](https://dof.gob.mx/nota_detalle.php?codigo=5280847&fecha=30%2F11%2F2012)
- [Certificación NOM-024-SSA3-2012 — DGIS](http://www.dgis.salud.gob.mx/contenidos/intercambio/certificacion-nom-024-ssa3-2012.html)
- [Guía rápida del proceso de certificación — DGIS](http://www.dgis.salud.gob.mx/contenidos/intercambio/guias/guia_rapida_proceso_de_certificacion.pdf)
- [Guías de Intercambio de Información en Salud (GIIS) — DGIS](http://www.dgis.salud.gob.mx/contenidos/intercambio/iis_guias_gobmx.html)
- [Cartas de consentimiento informado conforme a NOM-004 — FEMECOG](https://www.femecog.org.mx/docs/cartasconsentimiento.pdf)
- [Nueva LFPDPPP 2025 y desaparición del INAI — Garrigues](https://www.garrigues.com/es_ES/noticia/mexico-nueva-ley-federal-proteccion-datos-personales-posesion-particulares-introduce)
