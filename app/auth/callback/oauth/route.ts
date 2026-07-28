import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { redirigirSegunRol } from "@/app/auth/acciones";
import { crearClienteServidor } from "@/lib/supabase/server";

const ENLACE_INVALIDO = "No se pudo iniciar sesión con Google. Intenta de nuevo.";

/**
 * Destino de "Continuar con Google" (signInWithOAuth). Vive en su propia
 * ruta, separada de app/auth/callback/page.tsx: ese es el flujo implícito
 * de los enlaces que genera el admin (#access_token en el fragmento);
 * signInWithOAuth usa PKCE de verdad — el navegador ya guardó el
 * code_verifier al iniciar el flujo, así que aquí sí llega un `?code=` que
 * el servidor puede intercambiar. Next.js tampoco permite route.ts y
 * page.tsx en el mismo segmento.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    redirect(`/auth/iniciar-sesion?error=${encodeURIComponent(ENLACE_INVALIDO)}`);
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    redirect(`/auth/iniciar-sesion?error=${encodeURIComponent(ENLACE_INVALIDO)}`);
  }

  await redirigirSegunRol(supabase, data.user.id);
}
