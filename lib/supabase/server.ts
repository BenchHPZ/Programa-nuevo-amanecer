import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./tipos";

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 * Debe crearse de nuevo en cada request (nunca reutilizar la instancia).
 */
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesParaEstablecer) {
          try {
            cookiesParaEstablecer.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignorable: ocurre cuando setAll se llama desde un Server
            // Component. El middleware ya se encarga de refrescar la sesión.
          }
        },
      },
    },
  );
}
