/**
 * Validación de las filas del CSV de contingencia (RF-193).
 *
 * Vive aparte de la acción de servidor para que la previsualización y la
 * importación real usen literalmente el mismo código. Si la vista previa
 * dice "12 filas listas", tienen que entrar 12: una previsualización que no
 * predice el resultado es peor que no tenerla, porque se confía en ella.
 */

export const COLUMNAS_REQUERIDAS = [
  "nombre",
  "apellido_paterno",
  "fecha_nacimiento",
  "sexo",
  "responsable_nombre",
  "responsable_apellido_paterno",
  "parentesco",
] as const;

export const COLUMNAS_OPCIONALES = [
  "apellido_materno",
  "curp",
  "telefono",
  "municipio",
  "estado_geografico",
  "responsable_apellido_materno",
  "responsable_telefono",
  "responsable_curp",
] as const;

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ES_CURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/;

export interface FilaAnalizada {
  /** Número de fila del archivo, contando el encabezado como 1. */
  linea: number;
  datos: Record<string, string>;
  errores: string[];
  /** Coincidencias probables con personas ya registradas. Informativo. */
  posiblesDuplicados: { nombre: string; motivo: string }[];
}

export function validarFila(datos: Record<string, string>): string[] {
  const errores: string[] = [];

  for (const columna of COLUMNAS_REQUERIDAS) {
    if (!datos[columna]) errores.push(`Falta ${columna.replace(/_/g, " ")}`);
  }

  if (datos.fecha_nacimiento && !ES_FECHA.test(datos.fecha_nacimiento)) {
    errores.push("La fecha de nacimiento debe ir como AAAA-MM-DD");
  }

  if (datos.sexo && !["H", "M"].includes(datos.sexo.toUpperCase())) {
    errores.push("El sexo debe ser H o M");
  }

  for (const campo of ["curp", "responsable_curp"]) {
    const valor = datos[campo];
    if (valor && !ES_CURP.test(valor.toUpperCase())) {
      errores.push(`La ${campo.replace(/_/g, " ")} no tiene el formato de una CURP`);
    }
  }

  for (const campo of ["telefono", "responsable_telefono"]) {
    const valor = datos[campo];
    if (valor && !/^\d{10}$/.test(valor)) {
      errores.push(`El ${campo.replace(/_/g, " ")} debe tener 10 dígitos`);
    }
  }

  return errores;
}

/** Separa lo que se puede importar de lo que no. */
export function filasImportables(filas: FilaAnalizada[]): FilaAnalizada[] {
  return filas.filter((f) => f.errores.length === 0);
}
