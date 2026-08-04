import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./tipos";

/**
 * Rutas de la app interna: requieren sesión Y usuario_perfil.estado = 'activo'.
 * Esto es UX (redirige a donde corresponde); la garantía real de acceso vive
 * en Row Level Security (RNF-10) — si algo se cuela aquí, la base de datos
 * lo detiene igual.
 */
const RUTAS_PROTEGIDAS = ["/captura", "/dictamen", "/admin", "/imprimir", "/pacientes"];
const RUTAS_SOLO_ADMINISTRATIVO = ["/admin"];

export async function actualizarSesion(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaEstablecer) {
          cookiesParaEstablecer.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesParaEstablecer.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // No usar getSession() aquí: getUser() revalida el token contra Supabase
  // Auth en cada request, que es lo que hace confiable esta verificación.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const esRutaProtegida = RUTAS_PROTEGIDAS.some((ruta) => pathname.startsWith(ruta));

  if (!esRutaProtegida) {
    return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/iniciar-sesion";
    url.searchParams.set("siguiente", pathname);
    return NextResponse.redirect(url);
  }

  const { data: perfil } = await supabase
    .from("usuario_perfil")
    .select("estado, rol")
    .eq("id", user.id)
    .single();

  if (!perfil || perfil.estado !== "activo") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/pendiente-aprobacion";
    return NextResponse.redirect(url);
  }

  const requiereAdmin = RUTAS_SOLO_ADMINISTRATIVO.some((ruta) => pathname.startsWith(ruta));
  if (requiereAdmin && perfil.rol !== "administrativo") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sin-permiso";
    return NextResponse.redirect(url);
  }

  return response;
}
