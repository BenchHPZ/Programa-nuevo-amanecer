import type { RolUsuario } from "@/lib/supabase/tipos";

/**
 * A dónde manda el sistema a alguien ya autenticado, según su rol.
 * `/pacientes` es la lista central de expedientes — capturista, médico e
 * informista aterrizan ahí y desde cada fila deciden Captura, Dictaminar o
 * Vista según lo que su rol permita. Administrativo sigue en `/admin`, con
 * su propio botón "Expedientes" hacia la misma lista.
 */
export const DESTINO_POR_ROL: Record<RolUsuario, string> = {
  administrativo: "/admin",
  capturista: "/pacientes",
  informista: "/pacientes",
  medico_triage: "/pacientes",
  primer_contacto: "/",
  autorizador: "/",
  evaluador_prequirurgico: "/",
  programador: "/",
};
