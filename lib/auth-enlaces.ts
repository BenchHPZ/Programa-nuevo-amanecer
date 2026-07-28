import { headers } from "next/headers";

/**
 * A dónde debe volver quien haga clic en un enlace de invitación o de
 * restablecimiento de contraseña generado por admin.auth.admin.generateLink().
 * Supabase redirige aquí con la sesión en el fragmento de la URL
 * (#access_token=...) tras verificar el enlace; /auth/callback la recoge
 * del lado del navegador y manda a /auth/nueva-contrasena.
 *
 * Se arma a partir del host de la petición en curso, no de una variable de
 * entorno: una constante así es fácil de dejar desincronizada del dominio
 * real (ver .env.example, donde ya se quitaron dos variables así por no
 * usarse — no vale la pena repetir el problema aquí).
 *
 * El dominio destino tiene que estar en additional_redirect_urls
 * (supabase/config.toml en local; panel de Supabase en producción) — sin
 * eso, GoTrue descarta este valor y regresa al site_url pelón.
 */
export async function construirRedirectTo(): Promise<string> {
  const encabezados = await headers();
  const host = encabezados.get("x-forwarded-host") ?? encabezados.get("host");
  const protocolo = encabezados.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}/auth/callback?next=/auth/nueva-contrasena`;
}
