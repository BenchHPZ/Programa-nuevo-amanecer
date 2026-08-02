import type { RolUsuario } from "@/lib/supabase/tipos";

/** A dónde manda el sistema a alguien ya autenticado, según su rol. */
export const DESTINO_POR_ROL: Record<RolUsuario, string> = {
  administrativo: "/admin",
  capturista: "/captura",
  informista: "/captura",
  medico_triage: "/dictamen",
  primer_contacto: "/",
  autorizador: "/",
  evaluador_prequirurgico: "/",
  programador: "/",
};
