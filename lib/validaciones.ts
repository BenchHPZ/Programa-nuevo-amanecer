/**
 * Formatos compartidos entre la captura en vivo (RF-11x), el pre-registro
 * público (RF-180) y la importación de contingencia (RF-193). Antes vivían
 * duplicados en cada uno; un solo lugar evita que el regex de CURP de un
 * formulario acepte algo que el de otro rechaza.
 */

export const ES_CURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/;
export const ES_TELEFONO = /^\d{10}$/;
export const ES_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarCurp(valor: string): boolean {
  return ES_CURP.test(valor.toUpperCase());
}

export function validarTelefono(valor: string): boolean {
  return ES_TELEFONO.test(valor);
}

export function validarCorreo(valor: string): boolean {
  return ES_CORREO.test(valor);
}
