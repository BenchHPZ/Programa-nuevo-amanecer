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
 * Para la landing pública (RF-170/171): la convocatoria vigente, sin
 * sesión. A diferencia de obtenerJornadaActiva() (solo 'etapa1', para
 * enrutar a capturistas/médicos), aquí interesa la próxima jornada
 * anunciable — 'planeada' o 'etapa1' — para poder anunciar sede y fechas
 * antes de que arranque la semana de captura.
 */
export async function obtenerJornadaParaConvocatoria() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("jornada")
    .select("nombre, sede, fecha_inicio_etapa1, fecha_fin_etapa1")
    .in("estado", ["planeada", "etapa1"])
    .order("fecha_inicio_etapa1", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
}
