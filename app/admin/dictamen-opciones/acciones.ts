"use server";

import { revalidatePath } from "next/cache";

import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database, ResultadoDictamen } from "@/lib/supabase/tipos";

const RESULTADOS_VALIDOS = new Set<ResultadoDictamen>([
  "apto_cirugia",
  "apto_laser",
  "no_apto",
  "regresar_6_meses",
  "cirugia_guanajuato",
  "cirugia_leon",
]);

function validarDefinicion(json: unknown): string | null {
  if (typeof json !== "object" || json === null || !("opciones" in json)) {
    return 'Debe ser un objeto con la forma { "opciones": [...] }.';
  }
  const opciones = (json as { opciones: unknown }).opciones;
  if (!Array.isArray(opciones) || opciones.length === 0) {
    return '"opciones" debe ser un arreglo no vacío.';
  }
  for (const [i, o] of opciones.entries()) {
    if (typeof o !== "object" || o === null) return `La opción #${i + 1} no es un objeto.`;
    const opcion = o as Record<string, unknown>;
    if (typeof opcion.resultado !== "string" || !RESULTADOS_VALIDOS.has(opcion.resultado as ResultadoDictamen)) {
      return `La opción #${i + 1} tiene un "resultado" inválido. Válidos: ${[...RESULTADOS_VALIDOS].join(", ")}.`;
    }
    if (typeof opcion.etiqueta !== "string" || !opcion.etiqueta.trim()) {
      return `La opción #${i + 1} ("${opcion.resultado}") necesita "etiqueta".`;
    }
    if (opcion.descripcion !== undefined && typeof opcion.descripcion !== "string") {
      return `La opción #${i + 1} ("${opcion.resultado}"): "descripcion" debe ser texto si se incluye.`;
    }
  }
  return null;
}

/**
 * Nueva versión del catálogo de opciones de dictamen, sin desplegar código.
 * Mismo patrón que guardarCatalogo() (app/admin/catalogo/acciones.ts):
 * conserva el historial, la versión anterior deja de estar vigente pero no
 * se borra.
 */
export async function guardarCatalogoDictamen(jornadaId: string, definicionTexto: string) {
  let definicion: unknown;
  try {
    definicion = JSON.parse(definicionTexto);
  } catch {
    return { error: "El texto no es JSON válido." };
  }

  const errorValidacion = validarDefinicion(definicion);
  if (errorValidacion) return { error: errorValidacion };

  const supabase = await crearClienteServidor();

  const { data: actual } = await supabase
    .from("catalogo_dictamen")
    .select("version")
    .eq("jornada_id", jornadaId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const siguienteVersion = (actual?.version ?? 0) + 1;

  const { error: errorBaja } = await supabase
    .from("catalogo_dictamen")
    .update({ vigente: false })
    .eq("jornada_id", jornadaId)
    .eq("vigente", true);
  if (errorBaja) return { error: errorBaja.message };

  const { error: errorAlta } = await supabase.from("catalogo_dictamen").insert({
    jornada_id: jornadaId,
    definicion: definicion as Database["public"]["Tables"]["catalogo_dictamen"]["Row"]["definicion"],
    version: siguienteVersion,
    vigente: true,
  });
  if (errorAlta) return { error: errorAlta.message };

  revalidatePath("/admin/dictamen-opciones");
  revalidatePath("/pacientes");
  return { exito: true, version: siguienteVersion };
}
