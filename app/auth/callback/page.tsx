"use client";

import { useEffect, useState } from "react";

import { crearClienteNavegador } from "@/lib/supabase/client";

const ENLACE_INVALIDO = "El enlace ya no es válido. Pide uno nuevo.";

/**
 * Destino de los enlaces de invitación y de restablecimiento de contraseña
 * (generarEnlaceRestablecimiento, invitarColaborador).
 *
 * Tiene que ser una página de cliente, no un Route Handler: GoTrue no
 * regresa aquí con un `?code=` (eso es PKCE, y PKCE exige que el mismo
 * navegador haya iniciado el flujo con un code_verifier — no aplica a un
 * enlace que genera el admin desde el servidor). Regresa con
 * `#access_token=...&refresh_token=...` en el fragmento, que por diseño de
 * HTTP nunca llega al servidor — solo el navegador puede leerlo.
 *
 * La salida es `window.location.href`, no `router.replace()`: hace falta
 * una petición nueva de verdad para que /auth/nueva-contrasena (componente
 * de servidor) lea la sesión que `setSession` acaba de escribir en las
 * cookies — una navegación de cliente podría reusar un RSC ya en caché.
 */
export default function PaginaCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const siguiente = new URLSearchParams(window.location.search).get("next") ?? "/auth/nueva-contrasena";
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const parametros = new URLSearchParams(hash);

    const accessToken = parametros.get("access_token");
    const refreshToken = parametros.get("refresh_token");

    if (!accessToken || !refreshToken) {
      window.location.href = `/auth/iniciar-sesion?error=${encodeURIComponent(ENLACE_INVALIDO)}`;
      return;
    }

    const supabase = crearClienteNavegador();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error: err }) => {
      if (err) {
        setError(ENLACE_INVALIDO);
        window.location.href = `/auth/iniciar-sesion?error=${encodeURIComponent(ENLACE_INVALIDO)}`;
        return;
      }
      window.location.href = siguiente;
    });
  }, []);

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{error ?? "Verificando enlace…"}</p>
    </div>
  );
}
