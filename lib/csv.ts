/**
 * Lector de CSV mínimo para la importación de contingencia (RF-193).
 *
 * No se usa una librería a propósito: el archivo lo produce esta misma app
 * (la plantilla de `config/`) o alguien escribiéndolo en Excel, y lo único
 * que hace falta es respetar comillas, comas dentro de comillas y saltos de
 * línea. Una dependencia más es una dependencia más que auditar antes de
 * una jornada.
 */

/** Quita el BOM que Excel escribe al guardar como "CSV UTF-8". */
function sinBom(texto: string): string {
  return texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
}

/**
 * Divide respetando comillas dobles al estilo RFC 4180: `""` dentro de un
 * campo entrecomillado es una comilla literal.
 */
function partirFilas(texto: string): string[][] {
  const filas: string[][] = [];
  let campos: string[] = [];
  let actual = "";
  let enComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          actual += '"';
          i++;
        } else {
          enComillas = false;
        }
      } else {
        actual += c;
      }
      continue;
    }

    if (c === '"') {
      enComillas = true;
    } else if (c === "," || c === ";") {
      campos.push(actual);
      actual = "";
    } else if (c === "\n") {
      campos.push(actual);
      filas.push(campos);
      campos = [];
      actual = "";
    } else if (c !== "\r") {
      actual += c;
    }
  }

  // Último campo, si el archivo no termina en salto de línea.
  if (actual.length > 0 || campos.length > 0) {
    campos.push(actual);
    filas.push(campos);
  }

  return filas.filter((f) => f.some((c) => c.trim() !== ""));
}

export interface ResultadoLectura {
  encabezados: string[];
  filas: Record<string, string>[];
  error: string | null;
}

/**
 * Devuelve cada fila como objeto con los encabezados del archivo como llaves,
 * normalizados a minúsculas y sin espacios: quien llena la plantilla en Excel
 * puede escribir "Nombre" o "nombre " sin que la importación falle por eso.
 */
export function leerCsv(texto: string): ResultadoLectura {
  const filas = partirFilas(sinBom(texto));

  if (filas.length === 0) {
    return { encabezados: [], filas: [], error: "El archivo está vacío." };
  }

  const encabezados = filas[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

  if (filas.length === 1) {
    return { encabezados, filas: [], error: "El archivo solo trae encabezados, sin datos." };
  }

  const datos = filas.slice(1).map((fila) => {
    const objeto: Record<string, string> = {};
    encabezados.forEach((h, i) => {
      objeto[h] = (fila[i] ?? "").trim();
    });
    return objeto;
  });

  return { encabezados, filas: datos, error: null };
}
