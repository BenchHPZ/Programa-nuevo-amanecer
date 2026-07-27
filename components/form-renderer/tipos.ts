/**
 * Forma del JSON en catalogo_campos.definicion (RF-130). La asociación
 * entrega el catálogo real; esto es el contrato que debe cumplir sin
 * importar quién lo edite (ver /admin/catalogo, RF-131).
 */

export type TipoCampo =
  | "texto"
  | "texto_largo"
  | "numero"
  | "booleano"
  | "fecha"
  | "seleccion"
  | "seleccion_multiple";

export interface CampoCatalogo {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  opciones?: string[];
  ayuda?: string;
}

export interface DefinicionCatalogo {
  campos: CampoCatalogo[];
}

export type ValorCampo = string | number | boolean | string[] | null | undefined;
export type DatosSeccion = Record<string, ValorCampo>;

/** Un campo requerido cuenta como lleno si no es null/undefined/""/[] . */
export function seccionCompleta(campos: CampoCatalogo[], datos: DatosSeccion): boolean {
  return campos
    .filter((c) => c.requerido)
    .every((c) => {
      const v = datos[c.clave];
      if (v === null || v === undefined) return false;
      if (typeof v === "string") return v.trim().length > 0;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    });
}
