import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * "Médico" y "admin" del requerimiento de negocio son, en el sistema de
 * roles real, medico_triage y administrativo — no existe un rol literal
 * "medico"/"admin" en rol_usuario. Es un chequeo de UI (mostrar u ocultar
 * el botón de eliminar); RLS (medicos_desactivan_foto_paciente) es quien
 * de verdad lo hace cumplir del lado del servidor.
 */
export async function puedeGestionarFotos(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: perfil } = await supabase
    .from("usuario_perfil")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  return perfil?.rol === "medico_triage" || perfil?.rol === "administrativo";
}
