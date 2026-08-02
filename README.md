# Programa Nuevo Amanecer — Sistema de gestión de jornadas

Sistema de gestión para las jornadas quirúrgicas gratuitas de labio y paladar hendido del
Programa Nuevo Amanecer, A.C. Digitaliza por primera vez un proceso que ha operado en papel
durante ~35-40 años.

> **Naturaleza del sistema.** Esto es un sistema de **gestión administrativa de la jornada**
> (preselección de candidatos, folios, logística, papelería y programación de quirófanos).
> **No es un expediente clínico electrónico.** El expediente clínico oficial de las cirugías
> es y sigue siendo el del hospital receptor. Ver [docs/CUMPLIMIENTO.md](docs/CUMPLIMIENTO.md).

---

## Estado actual

| | |
|---|---|
| **Etapa en curso** | Etapa 1 — Primera revisión |
| **Jornada objetivo** | Guanajuato · 3 al 7 de agosto de 2026 |
| **Ventana de desarrollo** | 27 de julio – 6 de agosto de 2026 |
| **Última actualización** | 6 de agosto de 2026 |

### Avance

- [x] Documentación base del proyecto
- [x] Aislamiento de datos y andamiaje del repositorio
- [x] Next.js + Supabase + autenticación con aprobación
- [x] Esquema, auditoría y deduplicación
- [x] Captura de paciente y responsable
- [x] Motor de formularios por catálogo
- [x] Dictamen médico y asignación de folio
- [x] Impresión, consentimientos y landing v1
- [x] Panel admin: listado con filtros, exportación auditada, tablero, importación
      de contingencia y respaldos · bandeja de pre-registros (RF-181)
- [x] Identidad de marca aplicada: color, tipografía y logotipos
- [x] Landing pública y registro de colaboradores
- [x] Listo para desplegar: instructivo completo en [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md)
- [ ] **Desplegar de verdad** — falta ejecutar el instructivo contra las cuentas reales de
      Vercel y Supabase (son pasos que solo se pueden hacer desde esos paneles)
- [ ] **Ensayo general** con los 5 capturistas reales — es lo único de la Etapa 1
      que no se puede hacer sin ellos. Ver [docs/OPERACION.md](docs/OPERACION.md) §1

---

## Documentación

| Documento | Contenido |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | Plan por etapas, cronograma y alcance |
| [docs/REQUERIMIENTOS.md](docs/REQUERIMIENTOS.md) | Requerimientos numerados y trazables (RF / RNF) |
| [docs/MODELO-DATOS.md](docs/MODELO-DATOS.md) | Esquema de base de datos y decisiones de diseño |
| [docs/CUMPLIMIENTO.md](docs/CUMPLIMIENTO.md) | Normativa mexicana aplicable y cómo se cumple |
| [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) | Instructivo paso a paso para llevar el proyecto a Vercel + Supabase |
| [docs/OPERACION.md](docs/OPERACION.md) | Flujo del día, contingencia, respaldos y manejo de datos |
| [docs/MANUAL-ROLES.md](docs/MANUAL-ROLES.md) | Qué le toca a cada rol, comprobado contra los permisos de la base |
| [docs/HISTORIA.md](docs/HISTORIA.md) | Historia, misión y colaboradores del programa |
| [docs/MANUAL-IMAGEN.md](docs/MANUAL-IMAGEN.md) | Identidad visual: logo, color, tipografía y tono |

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind 4 · shadcn/ui |
| Backend | Supabase — PostgreSQL, Auth, Storage, Row Level Security |
| Hosting | Vercel |

### Deuda técnica conocida

`npm audit` reporta 12 vulnerabilidades altas, **todas transitivas del andamiaje oficial de
Next.js**. No se corrigen porque `npm audit fix --force` degradaría Next de 16.2.12 a **9.3.3**,
lo que rompería el proyecto. Desglose:

- **9 de 12** vienen de la cadena de ESLint (`minimatch` → `brace-expansion`, DoS) y solo
  afectan herramientas de desarrollo, no el código en producción.
- **`postcss` y `sharp`** entran a través de `next`. Se resolverán cuando Next publique
  versiones con las dependencias actualizadas.

**Revisar antes de cada despliegue a producción.**

---

## Puesta en marcha

```bash
npm install
cp .env.example .env.local     # llenar con las llaves del proyecto Supabase
npx supabase start             # Postgres local + Studio
npx supabase db reset          # aplica migraciones y semillas sintéticas
npm run dev                    # http://localhost:3000
```

Requiere Node 20+, Docker (para Supabase local) y la CLI de Supabase.

### Variables de entorno

Ver [`.env.example`](.env.example). La llave `SUPABASE_SERVICE_ROLE_KEY` es de servidor
únicamente: nunca debe exponerse al cliente ni versionarse.

---

## Estructura

```
├── app/
│   ├── page.tsx             landing — historia, cifras, convocatoria, aliados, contacto
│   ├── icon.png             favicon, generado desde el logotipo
│   ├── aviso-de-privacidad/ aviso integral (RF-171), público y sin sesión
│   ├── pre-registro/        formulario público de pacientes (RF-180..183)
│   ├── colaborar/           registro público de colaboradores — 4 perfiles
│   ├── auth/                registro, inicio de sesión, estados de acceso
│   ├── admin/               solo administrativo
│   │   ├── layout.tsx         header persistente: módulo, ir al panel, cerrar sesión
│   │   ├── page.tsx           tablero con los conteos del día (RF-192)
│   │   ├── expedientes/       padrón con filtros por estado/dictamen/servicio/fecha
│   │   ├── exportar/          route handler: CSV con BOM, auditado en audit_log
│   │   ├── importar/          contingencia en papel, con previsualización obligatoria
│   │   ├── colaboradores/     bandeja de quien se ofreció a apoyar
│   │   └── usuarios/ jornadas/ catalogo/
│   ├── captura/             listado, alta con dedupe, ficha con autoguardado
│   │   ├── layout.tsx         header persistente (mismo componente que admin/dictamen)
│   │   ├── nuevo/             asistente: buscar/crear paciente y responsable
│   │   ├── pre-registros/     bandeja pública: validar y promover (RF-181)
│   │   └── [expedienteId]/    secciones 1-4 + papelería — médico tiene aquí las mismas
│   │                          facultades que capturista (ver docs/MANUAL-ROLES.md §4)
│   ├── dictamen/            listado del médico + dictamen (4 salidas) → folio + QR
│   │   ├── layout.tsx         header persistente (mismo componente que admin/captura)
│   │   └── [expedienteId]/    historia clínica, foto (3 vistas + eliminar) y dictamen
│   └── imprimir/            folio (térmico/carta), constancia y 3 consentimientos
│                              prellenados — window.print(), sin PDF en servidor
├── components/
│   ├── ui/                   shadcn/ui (Base UI)
│   ├── marca/                logotipo, con las reglas de uso del manual
│   ├── layout/                header persistente: módulo actual, ir al panel según rol,
│   │                          cerrar sesión (sin logo — docs/MANUAL-IMAGEN.md §6)
│   ├── expediente/            foto del paciente: 3 vistas fijas, cámara/archivo según
│   │                          dispositivo, vista ampliada y eliminar (borrado lógico)
│   └── form-renderer/        motor genérico: catálogo JSON → formulario con autoguardado,
│                              con subsecciones opcionales para agrupar campos con título
├── lib/
│   ├── qr.ts                 QR del folio (SVG, sin canvas ni servicio externo)
│   ├── storage.ts            URLs firmadas de corta duración para el bucket privado
│   ├── comprimir-imagen.ts   compresión de escaneos en el navegador antes de subir
│   ├── expedientes.ts        consulta con filtros, compartida por listado y exportación
│   ├── csv.ts                lector de CSV para la importación de contingencia
│   ├── importacion.ts        validación de filas, compartida por vista previa e importación
│   ├── nombres.ts            separa "nombre completo" en nombre y apellidos (conjetura)
│   ├── jornada.ts            jornada activa y próxima convocatoria pública
│   ├── roles.ts               mapa rol → ruta del tablero, usado por el header y al iniciar sesión
│   ├── permisos.ts            permisos de UI espejo de RLS: quién gestiona fotos, quién
│   │                          edita cada sección del catálogo (antecedentes/socioeconómico)
│   └── supabase/             clientes (browser/server/admin/middleware) + tipos generados
├── scripts/
│   ├── respaldo.ps1          respaldo manual: esquema + datos, con verificación
│   └── generar-marca.mjs     genera public/marca/ desde el logotipo original
├── supabase/
│   ├── migrations/           esquema, RLS, triggers de auditoría, funciones
│   └── seed.sql              SOLO datos sintéticos
├── public/marca/            logotipos versionados (color, oscuro, monocromos, sol)
├── config/                  plantillas y contenido editable de la landing
├── docs/                    documentación del proyecto
└── privado/                 ⚠ EXCLUIDO DE GIT — datos reales
```

No se usan route groups: las rutas internas (`/admin/*`, `/captura/*`) son URLs reales,
protegidas por `proxy.ts` (sesión + estado `activo`) y, de fondo, por RLS.

---

## ⚠ Manejo de datos personales

Este sistema procesa **datos personales sensibles** (salud, en su mayoría de menores de edad).
Reglas no negociables:

1. **Nada real entra al repositorio.** Configuración de la jornada, catálogos reales,
   exportaciones, respaldos y escaneos viven en `privado/`, que está en `.gitignore`.
2. **Las semillas son sintéticas.** Generadas con faker en locale `es-MX`. Nunca un paciente
   real, ni siquiera "para probar".
3. **Nada se borra.** El borrado es lógico; las correcciones conservan el valor anterior en
   `audit_log`. Es exigencia de la NOM-004, no preferencia.
4. **Sin capturas de pantalla con datos reales** en la documentación o en issues.
5. Un **guardia pre-commit** rechaza commits con patrones de CURP, RFC o teléfonos de 10 dígitos.

---

## Mapa de etapas

| Etapa | Entrega | Cuándo |
|---|---|---|
| **1** | Captura, triage, folio, landing v1 | 27 jul – 2 ago · evento 3–7 ago 2026 |
| **1.5** | Consolidación, WhatsApp, modo offline | agosto 2026 |
| **2** | Día quirúrgico: 4 roles + quirófanos | ~3ª semana de septiembre 2026 |
| **3** | Encuestas, portal completo, informes, documentación normativa | octubre – noviembre 2026 |
| **4** | Certificación SIRES (NOM-024) | ~1er trimestre 2027 |

Detalle en [docs/PLAN.md](docs/PLAN.md).
