import { crearClienteServidor } from "@/lib/supabase/server";
import type { RolUsuario } from "@/lib/supabase/tipos";

/**
 * El rol de quien tiene la sesión activa, o `null` sin sesión o sin perfil
 * aprobado. Centraliza la misma consulta que antes se repetía suelta en
 * cada página (`/pacientes` la necesita para decidir qué botones mostrar
 * por fila: Captura, Dictaminar, Vista).
 */
export async function rolActual(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
): Promise<RolUsuario | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("usuario_perfil")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  return perfil?.rol ?? null;
}

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

/**
 * Espejo, en la UI, de las políticas RLS reales sobre expediente_seccion
 * (20260727090300_rls.sql y 20260804090400_medico_historia_clinica.sql) y
 * de puede_escribir() (20260806090400_medico_facultades_capturista.sql):
 * capturista/administrativo/medico_triage escriben ambas secciones — el
 * médico, en /captura, ya tiene las mismas facultades que un capturista.
 * Sin este chequeo, /captura mostraba ambas secciones como editables a
 * cualquiera que llegara ahí, y el guardado tronaba con el error crudo de
 * RLS en vez de simplemente no mostrarse como editable.
 */
const ROLES_QUE_EDITAN_SECCION: Record<"antecedentes" | "socioeconomico", RolUsuario[]> = {
  antecedentes: ["capturista", "administrativo", "medico_triage"],
  socioeconomico: ["capturista", "administrativo", "medico_triage"],
};

export async function puedeEditarSeccion(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  seccion: "antecedentes" | "socioeconomico",
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

  return !!perfil?.rol && ROLES_QUE_EDITAN_SECCION[seccion].includes(perfil.rol);
}
