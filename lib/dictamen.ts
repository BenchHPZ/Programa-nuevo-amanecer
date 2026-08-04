import { crearClienteServidor } from "@/lib/supabase/server";
import type { ResultadoDictamen } from "@/lib/supabase/tipos";

/**
 * Las 6 salidas posibles (vocabulario cerrado a nivel de base — RN-12) con
 * su variante de color, que es semántica y no cambia por jornada: apto es
 * "default", no apto es "destructive", lo que aplaza es "secondary". La
 * ETIQUETA (el texto) sí puede cambiar por jornada — eso lo decide
 * `catalogo_dictamen`, ver `etiquetaResultado` más abajo.
 */
export const ETIQUETA_RESULTADO_BASE: Record<
  ResultadoDictamen,
  { texto: string; variante: "default" | "secondary" | "destructive" }
> = {
  apto_cirugia: { texto: "Apto — cirugía", variante: "default" },
  apto_laser: { texto: "Apto — láser", variante: "default" },
  no_apto: { texto: "No apto", variante: "destructive" },
  regresar_6_meses: { texto: "Regresar en 6 meses", variante: "secondary" },
  cirugia_guanajuato: { texto: "Apto — cirugía Guanajuato", variante: "default" },
  cirugia_leon: { texto: "Apto — cirugía León", variante: "default" },
};

export interface OpcionDictamen {
  resultado: ResultadoDictamen;
  etiqueta: string;
  descripcion?: string;
}

/**
 * Las 4 salidas originales, tal cual estaban hardcodeadas en
 * formulario-dictamen.tsx antes de que el catálogo fuera configurable. Es
 * el default cuando una jornada no tiene `catalogo_dictamen` propio — así
 * ninguna jornada ya en curso cambia de comportamiento sin que un
 * administrativo lo pida.
 */
const OPCIONES_DEFAULT: OpcionDictamen[] = [
  { resultado: "apto_cirugia", etiqueta: "Apto para cirugía", descripcion: "Se le asigna folio de cirugía." },
  { resultado: "apto_laser", etiqueta: "Apto para láser", descripcion: "Se le asigna folio de láser." },
  { resultado: "no_apto", etiqueta: "No apto", descripcion: "Requiere recomendación de canalización." },
  { resultado: "regresar_6_meses", etiqueta: "Regresar en 6 meses", descripcion: "Sin folio; queda documentado el motivo." },
];

/**
 * Catálogo vigente de la jornada, o las 4 opciones originales si no
 * configuró uno (mismo patrón de "catálogo o default" que
 * app/captura/[expedienteId]/page.tsx ya usa para catalogo_campos).
 */
export async function obtenerOpcionesDictamen(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  jornadaId: string,
): Promise<OpcionDictamen[]> {
  const { data } = await supabase
    .from("catalogo_dictamen")
    .select("definicion")
    .eq("jornada_id", jornadaId)
    .eq("vigente", true)
    .maybeSingle();

  const definicion = data?.definicion as unknown as { opciones?: OpcionDictamen[] } | undefined;
  return definicion?.opciones?.length ? definicion.opciones : OPCIONES_DEFAULT;
}

/**
 * Texto a mostrar para un resultado ya registrado: la etiqueta configurada
 * en `opciones` si está presente (para que, por ejemplo, "regresar_6_meses"
 * se muestre como "Retorno en edición posterior" cuando la jornada lo
 * configuró así), si no el texto genérico. La variante de color siempre
 * viene del mapa base — es semántica, no de redacción.
 */
export function etiquetaResultado(
  resultado: ResultadoDictamen,
  opciones?: OpcionDictamen[],
): { texto: string; variante: "default" | "secondary" | "destructive" } {
  const base = ETIQUETA_RESULTADO_BASE[resultado];
  const propia = opciones?.find((o) => o.resultado === resultado);
  return { texto: propia?.etiqueta ?? base.texto, variante: base.variante };
}
