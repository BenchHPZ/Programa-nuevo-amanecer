"use server";

import { revalidatePath } from "next/cache";

import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/tipos";

type TipoSeccionCatalogo = "antecedentes" | "socioeconomico";

const TIPOS_VALIDOS = new Set([
  "texto",
  "texto_largo",
  "numero",
  "booleano",
  "fecha",
  "seleccion",
  "seleccion_multiple",
]);

function validarCampos(campos: unknown, prefijo = ""): string | null {
  if (!Array.isArray(campos)) return `${prefijo}"campos" debe ser un arreglo.`;
  for (const [i, c] of campos.entries()) {
    if (typeof c !== "object" || c === null) return `${prefijo}El campo #${i + 1} no es un objeto.`;
    const campo = c as Record<string, unknown>;
    if (typeof campo.clave !== "string" || !campo.clave) return `${prefijo}El campo #${i + 1} necesita "clave".`;
    if (typeof campo.etiqueta !== "string" || !campo.etiqueta) return `${prefijo}El campo #${i + 1} necesita "etiqueta".`;
    if (typeof campo.tipo !== "string" || !TIPOS_VALIDOS.has(campo.tipo)) {
      return `${prefijo}El campo #${i + 1} ("${campo.clave}") tiene un "tipo" inválido. Válidos: ${[...TIPOS_VALIDOS].join(", ")}.`;
    }
    if (
      (campo.tipo === "seleccion" || campo.tipo === "seleccion_multiple") &&
      (!Array.isArray(campo.opciones) || campo.opciones.length === 0)
    ) {
      return `${prefijo}El campo #${i + 1} ("${campo.clave}") es de selección y necesita "opciones" (arreglo no vacío).`;
    }
  }
  return null;
}

/**
 * Acepta la forma plana original ({ campos }) y/o la nueva forma agrupada
 * ({ subsecciones }), para que "Historia clínica" pueda organizarse en
 * subsecciones nombradas sin dejar de admitir catálogos ya guardados.
 */
function validarDefinicion(json: unknown): string | null {
  if (typeof json !== "object" || json === null || (!("campos" in json) && !("subsecciones" in json))) {
    return 'Debe ser un objeto con la forma { "campos": [...] } o { "subsecciones": [...] }.';
  }
  const obj = json as Record<string, unknown>;

  if ("campos" in obj) {
    const error = validarCampos(obj.campos);
    if (error) return error;
  }

  if ("subsecciones" in obj) {
    if (!Array.isArray(obj.subsecciones)) return '"subsecciones" debe ser un arreglo.';
    for (const [i, s] of obj.subsecciones.entries()) {
      if (typeof s !== "object" || s === null) return `La subsección #${i + 1} no es un objeto.`;
      const sub = s as Record<string, unknown>;
      if (typeof sub.titulo !== "string" || !sub.titulo.trim()) {
        return `La subsección #${i + 1} necesita "titulo".`;
      }
      const error = validarCampos(sub.campos, `Subsección "${sub.titulo}": `);
      if (error) return error;
    }
  }

  return null;
}

/**
 * Nueva versión del catálogo, sin desplegar código (RF-131). Conserva el
 * historial: la versión anterior deja de estar vigente pero no se borra,
 * así los expedientes ya capturados con ella conservan su significado
 * (RF-132).
 */
export async function guardarCatalogo(
  jornadaId: string,
  seccion: TipoSeccionCatalogo,
  definicionTexto: string,
) {
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
    .from("catalogo_campos")
    .select("version")
    .eq("jornada_id", jornadaId)
    .eq("seccion", seccion)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const siguienteVersion = (actual?.version ?? 0) + 1;

  const { error: errorBaja } = await supabase
    .from("catalogo_campos")
    .update({ vigente: false })
    .eq("jornada_id", jornadaId)
    .eq("seccion", seccion)
    .eq("vigente", true);
  if (errorBaja) return { error: errorBaja.message };

  const { error: errorAlta } = await supabase.from("catalogo_campos").insert({
    jornada_id: jornadaId,
    seccion,
    definicion: definicion as Database["public"]["Tables"]["catalogo_campos"]["Row"]["definicion"],
    version: siguienteVersion,
    vigente: true,
  });
  if (errorAlta) return { error: errorAlta.message };

  revalidatePath("/admin/catalogo");
  revalidatePath("/captura");
  return { exito: true, version: siguienteVersion };
}
