import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Para acciones que usan crearClienteAdmin() (service_role, que ignora RLS
 * por completo) — a diferencia de un UPDATE normal, donde RLS ya rechaza a
 * quien no sea administrativo, aquí hay que volver a verificarlo a mano.
 * Mismo razonamiento ya usado en app/admin/exportar/route.ts.
 */
export async function verificarEsAdministrativo(): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Sin sesión." };

  const { data: perfil } = await supabase
    .from("usuario_perfil")
    .select("rol, estado")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.estado !== "activo" || perfil?.rol !== "administrativo") {
    return { ok: false, error: "No autorizado." };
  }
  return { ok: true, id: user.id };
}
