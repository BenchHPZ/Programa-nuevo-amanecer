import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Consulta con filtros del padrón de una jornada (RF-190), compartida por la
 * pantalla de listado y por la exportación (RF-191).
 *
 * Que ambas usen esta misma función es el punto: si la exportación tuviera su
 * propia copia de los filtros, el CSV podría no coincidir con lo que el
 * administrativo acaba de ver en pantalla, y no habría forma de notarlo.
 */

export const ESTADOS = ["borrador", "completo", "dictaminado"] as const;
export const SERVICIOS = ["cirugia", "laser"] as const;
export const RESULTADOS = [
  "apto_cirugia",
  "apto_laser",
  "no_apto",
  "regresar_6_meses",
  "cirugia_guanajuato",
  "cirugia_leon",
] as const;

/** Valor extra del filtro de dictamen: aún no dictaminado. */
export const SIN_DICTAMEN = "sin_dictamen";

export type EstadoFiltro = (typeof ESTADOS)[number];
export type ServicioFiltro = (typeof SERVICIOS)[number];
export type DictamenFiltro = (typeof RESULTADOS)[number] | typeof SIN_DICTAMEN;

export interface FiltrosExpediente {
  estado?: EstadoFiltro;
  servicio?: ServicioFiltro;
  dictamen?: DictamenFiltro;
  desde?: string;
  hasta?: string;
  /** Por fecha del dictamen, no de creación del expediente — para el drill-down "dictaminados hoy" del tablero. */
  dictaminadoDesde?: string;
  dictaminadoHasta?: string;
}

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Los filtros llegan de la URL, así que son entrada no confiable: cualquiera
 * puede escribir `?estado=lo-que-sea`. Se valida contra las listas cerradas y
 * lo que no encaje se ignora en silencio — es un filtro, no un formulario:
 * más vale mostrar de más que romper la pantalla a media jornada.
 */
export function leerFiltros(sp: Record<string, string | string[] | undefined>): FiltrosExpediente {
  const uno = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : undefined;
  };
  const dentroDe = <T extends string>(
    v: string | undefined,
    permitidos: readonly T[],
  ): T | undefined => (v && (permitidos as readonly string[]).includes(v) ? (v as T) : undefined);
  const fecha = (v: string | undefined) => (v && ES_FECHA.test(v) ? v : undefined);

  return {
    estado: dentroDe(uno("estado"), ESTADOS),
    servicio: dentroDe(uno("servicio"), SERVICIOS),
    dictamen: dentroDe<DictamenFiltro>(uno("dictamen"), [...RESULTADOS, SIN_DICTAMEN]),
    desde: fecha(uno("desde")),
    hasta: fecha(uno("hasta")),
    dictaminadoDesde: fecha(uno("dictaminadoDesde")),
    dictaminadoHasta: fecha(uno("dictaminadoHasta")),
  };
}

export function hayFiltros(f: FiltrosExpediente): boolean {
  return Boolean(
    f.estado || f.servicio || f.dictamen || f.desde || f.hasta || f.dictaminadoDesde || f.dictaminadoHasta,
  );
}

export interface ExpedienteListado {
  id: string;
  estado: string;
  creado_en: string;
  paciente: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    fecha_nacimiento: string;
    sexo: string;
    curp: string | null;
    telefono: string | null;
    municipio: string | null;
    estado_geografico: string | null;
  } | null;
  dictamen_etapa1: { resultado: string; fecha: string } | null;
  folio: { folio_texto: string; servicio: string; digito_verificador: number; activo: boolean }[];
}

const CAMPOS_PACIENTE =
  "nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, curp, telefono, municipio, estado_geografico";

/**
 * `!inner` convierte el embed en INNER JOIN, que es lo que hace que filtrar
 * por una columna de la relación reduzca las filas del padre. Sin él,
 * PostgREST filtra solo el contenido del embed y devuelve el expediente
 * igual, con el embed vacío — el filtro parecería no hacer nada.
 */
function construirSelect(filtros: FiltrosExpediente): string {
  const necesitaDictamen =
    (filtros.dictamen && filtros.dictamen !== SIN_DICTAMEN) ||
    filtros.dictaminadoDesde ||
    filtros.dictaminadoHasta;
  const dictamenInterno = necesitaDictamen ? "!inner" : "";
  const folioInterno = filtros.servicio ? "!inner" : "";

  return [
    "id, estado, creado_en",
    `paciente:paciente_id(${CAMPOS_PACIENTE})`,
    `dictamen_etapa1${dictamenInterno}(resultado, fecha)`,
    `folio${folioInterno}(folio_texto, servicio, digito_verificador, activo)`,
  ].join(", ");
}

export async function consultarExpedientes(
  jornadaId: string,
  filtros: FiltrosExpediente,
  paginacion?: { limite: number; desplazamiento: number },
) {
  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("expediente")
    .select(construirSelect(filtros), { count: "exact" })
    .eq("jornada_id", jornadaId)
    .eq("activo", true);

  if (filtros.estado) consulta = consulta.eq("estado", filtros.estado);

  if (filtros.dictamen === SIN_DICTAMEN) {
    consulta = consulta.is("dictamen_etapa1", null);
  } else if (filtros.dictamen) {
    consulta = consulta.eq("dictamen_etapa1.resultado", filtros.dictamen);
  }

  if (filtros.servicio) {
    consulta = consulta.eq("folio.servicio", filtros.servicio).eq("folio.activo", true);
  }

  if (filtros.desde) consulta = consulta.gte("creado_en", `${filtros.desde}T00:00:00`);
  // `hasta` es inclusivo: quien filtra "hasta el 5 de agosto" espera que el
  // día 5 entre completo, no que se corte a la medianoche de su inicio.
  if (filtros.hasta) consulta = consulta.lte("creado_en", `${filtros.hasta}T23:59:59.999`);

  if (filtros.dictaminadoDesde) {
    consulta = consulta.gte("dictamen_etapa1.fecha", `${filtros.dictaminadoDesde}T00:00:00`);
  }
  if (filtros.dictaminadoHasta) {
    consulta = consulta.lte("dictamen_etapa1.fecha", `${filtros.dictaminadoHasta}T23:59:59.999`);
  }

  consulta = consulta.order("creado_en", { ascending: false });

  if (paginacion) {
    consulta = consulta.range(
      paginacion.desplazamiento,
      paginacion.desplazamiento + paginacion.limite - 1,
    );
  }

  const { data, error, count } = await consulta;

  return {
    expedientes: (data ?? []) as unknown as ExpedienteListado[],
    total: count ?? 0,
    error: error?.message ?? null,
  };
}
