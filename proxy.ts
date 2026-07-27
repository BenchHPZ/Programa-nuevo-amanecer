import { type NextRequest } from "next/server";

import { actualizarSesion } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  matcher: [
    /*
     * Corre en todo excepto assets estáticos, para que la sesión se
     * refresque en cada navegación de página.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
