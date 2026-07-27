"use server";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/tipos";

type TipoColaborador = Database["public"]["Enums"]["tipo_colaborador"];

const VENTANA_ANTIABUSO_MS = 24 * 60 * 60 * 1000;

const TIPOS: TipoColaborador[] = [
  "medico",
  "enfermeria_estudiante",
  "apoyo_general",
  "donativo",
];

export interface DatosColaborador {
  tipo: string;
  nombre: string;
  correo: string;
  telefono: string;
  ciudad: string;
  comentarios: string;
  /** Perfil médico */
  especialidad: string;
  institucion: string;
  cedula: string;
  aniosExperiencia: string;
  /** Perfil enfermería y estudiantes */
  carrera: string;
  semestre: string;
  servicioSocial: boolean;
  /** Perfil apoyo general */
  areaInteres: string;
  disponibilidad: string;
  /** Perfil donativo */
  organizacion: string;
  tipoApoyo: string;
  /** Aceptación del aviso de privacidad */
  aceptaAviso: boolean;
  /** Honeypot: invisible para personas; si llega lleno, es un bot. */
  sitioWeb: string;
}

/**
 * Registro público de colaboradores. No crea cuenta ni da acceso a nada: solo
 * llena una bandeja que un administrativo revisa. El alta de usuarios del
 * sistema sigue siendo auto-registro + aprobación (RF-101), y son cosas
 * distintas — la mayoría de quien se ofrece nunca va a necesitar entrar al
 * sistema.
 */
export async function registrarColaborador(datos: DatosColaborador) {
  // Bot: se responde "todo bien" sin guardar nada. Decirle que fue detectado
  // solo le enseña a evadir el siguiente intento.
  if (datos.sitioWeb.trim().length > 0) return { exito: true };

  const tipo = datos.tipo as TipoColaborador;
  if (!TIPOS.includes(tipo)) {
    return { error: "Elige en qué te gustaría colaborar." };
  }

  const nombre = datos.nombre.trim();
  const correo = datos.correo.trim().toLowerCase();
  const telefono = datos.telefono.trim();

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!correo && !telefono) {
    return { error: "Déjanos al menos un correo o un teléfono para poder contactarte." };
  }
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return { error: "El correo no parece válido." };
  }
  if (telefono && !/^\d{10}$/.test(telefono)) {
    return { error: "El teléfono debe tener 10 dígitos." };
  }
  if (!datos.aceptaAviso) {
    return { error: "Debes aceptar el aviso de privacidad para continuar." };
  }

  // Campos propios de cada perfil. Se guarda solo lo que corresponde al tipo
  // elegido: si alguien llena el formulario, cambia de perfil y envía, no
  // tiene sentido conservar los campos del perfil que descartó.
  const propios: Record<string, string | boolean> = {};
  if (tipo === "medico") {
    propios.especialidad = datos.especialidad.trim();
    propios.institucion = datos.institucion.trim();
    propios.cedula_profesional = datos.cedula.trim();
    propios.anios_experiencia = datos.aniosExperiencia.trim();
  } else if (tipo === "enfermeria_estudiante") {
    propios.institucion = datos.institucion.trim();
    propios.carrera = datos.carrera.trim();
    propios.semestre = datos.semestre.trim();
    propios.servicio_social = datos.servicioSocial;
  } else if (tipo === "apoyo_general") {
    propios.area_interes = datos.areaInteres.trim();
    propios.disponibilidad = datos.disponibilidad.trim();
  } else if (tipo === "donativo") {
    propios.organizacion = datos.organizacion.trim();
    propios.tipo_apoyo = datos.tipoApoyo.trim();
  }

  // Mitigación de abuso: mismo correo o teléfono, dos veces en 24 h. Requiere
  // service_role porque un visitante anónimo no puede leer la bandeja (ni
  // debe); el resultado nunca se expone, solo se cuenta.
  const admin = crearClienteAdmin();
  const desde = new Date(Date.now() - VENTANA_ANTIABUSO_MS).toISOString();
  const clave = correo ? "correo" : "telefono";
  const valor = correo || telefono;

  const { count, error: errorConteo } = await admin
    .from("registro_colaborador")
    .select("id", { count: "exact", head: true })
    .filter(`datos->>${clave}`, "eq", valor)
    .gte("creado_en", desde);

  // Se falla ABIERTO a propósito: este chequeo es secundario y bloquear a un
  // voluntario real por un fallo de infraestructura es peor que un duplicado.
  // Pero no en silencio: así fue como el mismo control quedó inservible en
  // pre_registro por un GRANT faltante, sin que nada lo delatara.
  if (errorConteo) {
    console.error("Chequeo anti-abuso de colaboradores falló:", errorConteo.message);
  }

  if ((count ?? 0) > 0) {
    return { error: "Ya recibimos un registro con estos datos en las últimas 24 horas." };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("registro_colaborador").insert({
    tipo,
    datos: {
      nombre,
      correo: correo || null,
      telefono: telefono || null,
      ciudad: datos.ciudad.trim() || null,
      comentarios: datos.comentarios.trim() || null,
      ...propios,
    },
  });

  if (error) return { error: "No se pudo enviar el registro. Intenta de nuevo." };
  return { exito: true };
}
