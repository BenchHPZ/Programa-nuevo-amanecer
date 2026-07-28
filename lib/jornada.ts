import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * La jornada activa es la que está en etapa1 ahora mismo. Si hay más de
 * una marcada así (no debería pasar, pero nada en el esquema lo impide
 * todavía), se toma la de inicio más reciente.
 */
export async function obtenerJornadaActiva() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("jornada")
    .select("*")
    .eq("estado", "etapa1")
    .order("fecha_inicio_etapa1", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

/**
 * Para la landing pública (RF-170/171): la próxima jornada todavía no
 * arrancada, sin sesión. Antes también incluía 'etapa1' (no había otra
 * forma de anunciar sede/fechas mientras corría la semana de captura), pero
 * eso ya lo cubre obtenerJornadaActivaPublica() — incluirla aquí también
 * duplicaría la misma jornada en dos bloques del banner.
 */
export async function obtenerJornadaParaConvocatoria() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("jornada")
    .select("nombre, sede, fecha_inicio_etapa1, fecha_fin_etapa1")
    .eq("estado", "planeada")
    .order("fecha_inicio_etapa1", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
}

/**
 * Para el banner de portada: la jornada que está corriendo ahora mismo
 * ('etapa1' o 'etapa2'), sin sesión. Toda la tabla `jornada` ya es de
 * lectura pública (20260802090000_landing_publica.sql) — ninguna de estas
 * columnas es sensible.
 */
export async function obtenerJornadaActivaPublica() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("jornada")
    .select("id, nombre, sede, estado, fecha_inicio_etapa1, fecha_fin_etapa1, fecha_etapa2")
    .in("estado", ["etapa1", "etapa2"])
    .order("fecha_inicio_etapa1", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

/**
 * Conteos agregados de una jornada activa, para el mismo banner —
 * `vista_conteos_publicos` (20260804090000_conteos_publicos.sql) nunca
 * expone una fila de paciente, solo números.
 */
export async function obtenerConteosPublicos(jornadaId: string) {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("vista_conteos_publicos")
    .select("*")
    .eq("jornada_id", jornadaId)
    .maybeSingle();

  return data;
}
