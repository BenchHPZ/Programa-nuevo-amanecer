import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./tipos";

/**
 * Cliente con service_role: ignora Row Level Security por completo.
 *
 * SOLO para código de servidor de confianza (p.ej. leer auth.users para
 * mostrar el correo en el panel admin, algo que PostgREST no expone vía
 * RLS normal). "server-only" hace que el build falle si esto se importa,
 * aunque sea por accidente, desde un componente de cliente.
 */
export function crearClienteAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
