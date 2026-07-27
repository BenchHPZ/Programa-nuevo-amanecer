/**
 * El pre-registro público pide "nombre del paciente" en un solo campo —
 * pedirle a una familia que separe nombre, apellido paterno y materno en un
 * formulario de celular es una fuente de errores mayor que adivinarlo aquí.
 * `persona` sí exige las tres partes por separado, así que al promover hay
 * que partirlo.
 *
 * Esto es una **conjetura**, no una verdad: el capturista ve el resultado
 * prellenado y lo corrige antes de guardar. Sigue la convención mexicana
 * (nombre[s] · apellido paterno · apellido materno), que no aplica a todos
 * los casos — un apellido compuesto sin partícula, o alguien de origen
 * extranjero con un solo apellido, saldrá mal repartido.
 */

/**
 * Partículas que se pegan al apellido que las sigue: "de la Cruz" es un
 * apellido, no tres. Sin esto, "Juan de la Cruz Pérez" se partiría en
 * apellido paterno "la" y materno "Cruz".
 */
const PARTICULAS = new Set([
  "de", "del", "la", "las", "los", "y", "e", "da", "das", "do", "dos",
  "di", "van", "von", "mc", "mac", "san", "santa",
]);

export interface NombreSeparado {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

/**
 * Saca un apellido del final de `tokens`, mutándolo. Absorbe las partículas
 * que lo preceden.
 *
 * La guarda `tokens.length > 1` es deliberada: sin ella, un nombre que
 * empieza con partícula podría consumirse entero y dejar el nombre de pila
 * vacío, que es peor que un reparto imperfecto.
 */
function extraerApellido(tokens: string[]): string {
  if (tokens.length === 0) return "";

  const partes = [tokens.pop() as string];
  while (tokens.length > 1 && PARTICULAS.has(tokens[tokens.length - 1].toLowerCase())) {
    partes.unshift(tokens.pop() as string);
  }
  return partes.join(" ");
}

export function separarNombre(completo: string): NombreSeparado {
  const tokens = completo.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) return { nombre: "", apellidoPaterno: "", apellidoMaterno: "" };
  if (tokens.length === 1) return { nombre: tokens[0], apellidoPaterno: "", apellidoMaterno: "" };
  if (tokens.length === 2) {
    return { nombre: tokens[0], apellidoPaterno: tokens[1], apellidoMaterno: "" };
  }

  // El materno sale primero porque se extrae desde el final.
  const restantes = [...tokens];
  const apellidoMaterno = extraerApellido(restantes);
  const apellidoPaterno = extraerApellido(restantes);

  // "Jose de la Cruz" consume los cuatro tokens entre los dos apellidos y
  // deja el nombre de pila vacío. La guarda de extraerApellido() protege
  // cada extracción por separado, pero no el efecto de las dos juntas.
  //
  // Cuando pasa, lo más probable es que no haya dos apellidos sino uno
  // compuesto: se conserva el primer token como nombre y el resto se junta
  // en el paterno. Un nombre de pila vacío nunca es la lectura correcta —
  // además de que `persona.nombre` es NOT NULL.
  if (restantes.length === 0) {
    return {
      nombre: tokens[0],
      apellidoPaterno: tokens.slice(1).join(" "),
      apellidoMaterno: "",
    };
  }

  return { nombre: restantes.join(" "), apellidoPaterno, apellidoMaterno };
}
