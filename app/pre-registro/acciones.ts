"use server";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { validarTelefono } from "@/lib/validaciones";

const VENTANA_ANTIABUSO_MS = 24 * 60 * 60 * 1000;

export interface DatosPreRegistro {
  nombrePaciente: string;
  nombreContacto: string;
  telefono: string;
  fechaNacimiento: string;
  servicio: string;
  municipio: string;
  comentarios: string;
  aceptaAviso: boolean;
  /** Honeypot: campo invisible para personas; si llega lleno, es un bot. */
  sitioWeb: string;
}

/**
 * RF-180/181/182/183: formulario público, sin sesión. No crea expediente —
 * solo llena la bandeja `pre_registro` que un capturista valida y
 * promueve después.
 */
export async function crearPreRegistro(datos: DatosPreRegistro) {
  if (datos.sitioWeb.trim().length > 0) {
    return { exito: true };
  }

  const nombrePaciente = datos.nombrePaciente.trim();
  const nombreContacto = datos.nombreContacto.trim();
  const telefono = datos.telefono.trim();
  const fechaNacimiento = datos.fechaNacimiento.trim();
  const servicio = datos.servicio.trim();
  const municipio = datos.municipio.trim();
  const comentarios = datos.comentarios.trim();

  if (!nombrePaciente || !nombreContacto || !telefono) {
    return { error: "Nombre del paciente, nombre de contacto y teléfono son obligatorios." };
  }
  if (!validarTelefono(telefono)) {
    return { error: "El teléfono debe tener 10 dígitos." };
  }
  if (!datos.aceptaAviso) {
    return { error: "Debes aceptar el aviso de privacidad para continuar." };
  }

  // Mitigación de abuso (RF-182): un mismo teléfono no puede volver a
  // pre-registrarse dentro de 24 horas. Requiere el cliente de
  // service_role porque la política de pre_registro no deja leer la
  // bandeja a un visitante anónimo — aquí solo se usa para contar
  // coincidencias, el resultado nunca se expone al cliente.
  const admin = crearClienteAdmin();
  const desde = new Date(Date.now() - VENTANA_ANTIABUSO_MS).toISOString();
  const { count, error: errorConteo } = await admin
    .from("pre_registro")
    .select("id", { count: "exact", head: true })
    .filter("datos->>telefono", "eq", telefono)
    .gte("creado_en", desde);

  // No bloquear el pre-registro de una familia real por un fallo de este
  // chequeo secundario — pero tampoco fallar en silencio: quedó así una
  // vez (permiso faltante de service_role) y el límite de abuso nunca se
  // aplicó sin que nada lo delatara.
  if (errorConteo) {
    console.error("Chequeo anti-abuso de pre-registro falló:", errorConteo.message);
  }

  if ((count ?? 0) > 0) {
    return { error: "Ya recibimos un pre-registro con este teléfono en las últimas 24 horas." };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("pre_registro").insert({
    datos: {
      nombre_paciente: nombrePaciente,
      fecha_nacimiento: fechaNacimiento || null,
      nombre_contacto: nombreContacto,
      telefono,
      servicio_deseado: servicio || null,
      municipio: municipio || null,
      comentarios: comentarios || null,
    },
  });

  if (error) return { error: "No se pudo enviar el pre-registro. Intenta de nuevo." };
  return { exito: true };
}
