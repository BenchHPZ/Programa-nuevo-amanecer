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

/** Grupo nombrado de campos dentro de una sección (p. ej. Historia clínica). */
export interface SubseccionCatalogo {
  titulo: string;
  campos: CampoCatalogo[];
}

/**
 * `campos` sigue siendo la forma plana original y `subsecciones` es la
 * nueva forma agrupada — ambas opcionales para que un catálogo ya guardado
 * sin `subsecciones` (o la sección "socioeconomico", que no las usa) siga
 * funcionando sin cambios.
 */
export interface DefinicionCatalogo {
  campos?: CampoCatalogo[];
  subsecciones?: SubseccionCatalogo[];
}

export type ValorCampo = string | number | boolean | string[] | null | undefined;
export type DatosSeccion = Record<string, ValorCampo>;

/** Un grupo de campos ya normalizado para renderizar, con o sin título. */
export interface GrupoCampos {
  titulo?: string;
  campos: CampoCatalogo[];
}

/**
 * `subsecciones` tiene prioridad si está presente; si no, `campos` se trata
 * como un único grupo sin título (comportamiento idéntico al de antes).
 */
export function normalizarGrupos(definicion: DefinicionCatalogo): GrupoCampos[] {
  if (definicion.subsecciones?.length) {
    return definicion.subsecciones.map((s) => ({ titulo: s.titulo, campos: s.campos }));
  }
  return [{ campos: definicion.campos ?? [] }];
}

export function todosLosCampos(definicion: DefinicionCatalogo): CampoCatalogo[] {
  return normalizarGrupos(definicion).flatMap((g) => g.campos);
}

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
