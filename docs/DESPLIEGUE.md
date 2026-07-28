# Despliegue a producción

**Programa Nuevo Amanecer, A.C. — sistema de gestión de jornadas**
Versión 1.0 · 3 de agosto de 2026

> Este documento es el instructivo para llevar el proyecto de "funciona en local" a "funciona
> en `https://algo.vercel.app` con datos reales". Se ejecuta **una sola vez**; después, cada
> `git push` a la rama de producción despliega solo.
>
> Requiere entrar a los paneles de Vercel y de Supabase con tu propia cuenta — son pasos que
> nadie más puede hacer por ti. Cada sección dice exactamente qué copiar y dónde pegarlo.

---

## Antes de empezar

- [ ] Cuenta de Vercel creada.
- [ ] Cuenta de Supabase creada.
- [ ] Decidir la rama de producción: el repositorio tiene `main` y `dev`; todo el trabajo
      hasta hoy se hizo en `dev`. Antes del paso 1, decide si haces `git merge dev main` y
      empujas `main`, o si en Vercel configuras `dev` como rama de producción. Cualquiera de
      las dos funciona; lo que importa es que Vercel despliegue la rama que de verdad tiene el
      código terminado.

**Plan elegido para este arranque:** Supabase gratuito, dominio `*.vercel.app` (sin dominio
propio todavía). Las secciones de abajo asumen eso; donde cambie algo si más adelante se
contrata Supabase Pro o se compra un dominio, está anotado en **Después de este despliegue**.

---

## 1. Vercel — crear el proyecto

1. En [vercel.com/new](https://vercel.com/new), **Import Git Repository** y elegir
   `BenchHPZ/Programa-nuevo-amanecer`. Vercel detecta Next.js solo, no hay que tocar el
   *Build Command* ni el *Output Directory*.
2. **Root Directory**: la raíz del repo.
3. Desplegar **sin variables de entorno todavía** — no hace falta ninguna para que el build
   pase (se leen en tiempo de request, no durante el build). Este primer despliegue solo sirve
   para obtener el dominio.
4. Anota el dominio que Vercel asigna (`https://<algo>.vercel.app`). Se usa en el paso 2.4.

---

## 2. Supabase — crear el proyecto y aplicar el esquema

1. En el dashboard de Supabase, **New Project**. Región: la más cercana a México disponible
   (no hay región México en Supabase — por eso el aviso de privacidad ya declara la
   transferencia internacional de datos). Guarda la contraseña de la base en un gestor de
   contraseñas, nunca en el repositorio.
2. En *Project Settings → API*, copia:
   - `Project URL`
   - `anon` `public` key
   - `service_role` key — **esta nunca se pega en el navegador ni se comparte por chat**
3. Desde una terminal, en la carpeta del proyecto:
   ```bash
   npx supabase link --project-ref <ref-del-proyecto>
   npx supabase db push
   ```
   `<ref-del-proyecto>` está en la URL del dashboard (`supabase.com/dashboard/project/<ref>`).
   El CLI pide la contraseña de la base del paso 1. Esto crea las 14 tablas, las políticas de
   Row Level Security, las funciones y **el bucket `papeleria`** (se crea por SQL en
   `supabase/migrations/20260801090000_almacenamiento.sql`; no hace falta crearlo a mano).

   **Nunca corras `supabase db reset` ni apliques `supabase/seed.sql` contra este proyecto** —
   la semilla trae cuentas y contraseñas de demostración, pensadas solo para desarrollo local.
4. En *Authentication → URL Configuration*:
   - `Site URL` = el dominio de Vercel del paso 1.4.
   - `Redirect URLs` = agregar el mismo dominio.

   Esto es independiente de `supabase/config.toml`, que **solo** controla `supabase start` en
   tu máquina — no tiene efecto sobre el proyecto remoto.
5. Verifica en *Table Editor* que aparecen las 14 tablas, y en *Storage* que existe el bucket
   `papeleria` marcado como privado.

---

## 3. Vercel — variables de entorno

1. En *Project Settings → Environment Variables* del proyecto creado en el paso 1, agrega:

   | Variable | Valor | Ámbito |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | del paso 2.2 | Production |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | del paso 2.2 | Production |
   | `SUPABASE_SERVICE_ROLE_KEY` | del paso 2.2 | **Production únicamente** |

2. **Redesplegar** (*Deployments → ⋯ → Redeploy*) — Vercel no aplica variables nuevas a un
   build que ya existe.
3. Confirmar que la landing carga en el dominio de Vercel y que `/aviso-de-privacidad` también.

> **Sobre la confirmación de correo al registrarse:** se deja apagada, igual que en desarrollo
> (`enable_confirmations` en el dashboard de Supabase → *Authentication → Sign In / Providers*).
> El control de acceso real no es el correo confirmado: es la aprobación manual del
> administrativo (RN-10 — un usuario `pendiente` no ve ningún dato en absoluto, ya verificado
> contra Row Level Security con las cuatro cuentas de prueba). Activarla exigiría configurar un
> SMTP propio (el envío por defecto de Supabase está limitado a 2 correos por hora) por una capa
> de seguridad que la aprobación manual ya cubre. Si se prefiere activarla de todas formas, es
> una sola casilla en el dashboard, sin tocar código.

---

## 4. El primer administrativo (arranque en frío)

**Este paso no existe en ningún otro lado del sistema — se ejecuta una sola vez.** Row Level
Security exige que quien aprueba usuarios ya esté aprobado; ni la primera cuenta puede
aprobarse a sí misma desde la aplicación.

1. En el sitio ya desplegado, registra la cuenta real del primer administrativo desde
   `/auth/registro`, con su correo verdadero. Queda en estado `pendiente`, sin rol.
2. En el **SQL Editor** del dashboard de Supabase (ahí sí se puede saltar Row Level Security),
   corre, sustituyendo el correo:
   ```sql
   update public.usuario_perfil
   set rol = 'administrativo', estado = 'activo', aprobado_en = now()
   where id = (select id from auth.users where email = 'correo-real@ejemplo.org');
   ```
3. Inicia sesión con esa cuenta: debe redirigir a `/admin` y el tablero de conteos debe cargar
   en ceros (base recién creada — no lleva los números de la semilla local).
4. De aquí en adelante, **todo el resto del personal se aprueba desde el panel**, como ya
   funciona normalmente. Este paso manual por SQL es exclusivamente para el primero. Aprovecha
   para aprobar a una segunda cuenta real desde el panel y confirmar que ese flujo normal
   funciona de punta a punta contra producción.

---

## 5. La pausa por inactividad (ya mitigada)

El plan gratuito de Supabase pausa el proyecto tras ~7 días sin actividad. `app/api/keepalive/route.ts`
+ `vercel.json` ya instalan una llamada diaria automática (Vercel Cron, gratis en el plan
Hobby) que evita la pausa. No requiere ninguna acción adicional al desplegar — empieza a correr
solo. Ver el detalle y sus límites en [OPERACION.md](OPERACION.md) §4.

---

## Verificación final

- [ ] La landing carga en el dominio de Vercel.
- [ ] `/aviso-de-privacidad` carga.
- [ ] `/auth/registro` crea una cuenta real sin errores.
- [ ] Tras el paso 4, iniciar sesión con la cuenta aprobada redirige a `/admin`.
- [ ] Se aprobó una segunda cuenta real desde el panel (no por SQL).
- [ ] Si se subió algún documento de prueba al bucket `papeleria` para verificarlo, el
      expediente de prueba se desactivó (`update public.expediente set activo=false ...`) en
      vez de dejarlo mezclado con el padrón real — este sistema no borra nada.
- [ ] `/api/keepalive` responde `{"ok":true}` (probarlo directo en el navegador).

## Después de este despliegue

| Pendiente | Cuándo hacerlo |
|---|---|
| Contratar Supabase Pro | Antes de que el volumen de jornadas reales lo justifique — habilita respaldo automático diario |
| Comprar y conectar un dominio propio | Cuando la asociación lo decida. En Vercel: *Settings → Domains*; en Supabase, actualizar `Site URL` y `Redirect URLs` al nuevo dominio |
| Configurar SMTP propio | Solo si se decide activar la confirmación de correo al registro |
| Revisión legal de los 4 documentos y contacto ARCO | Pendiente de la asociación y su asesor legal — la landing ya avisa visiblemente mientras falte |
