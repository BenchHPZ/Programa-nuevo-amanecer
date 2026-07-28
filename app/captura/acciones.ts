"use server";

import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/tipos";
import { validarCorreo, validarCurp, validarTelefono } from "@/lib/validaciones";

type PersonaInsert = Database["public"]["Tables"]["persona"]["Insert"];
type PersonaUpdate = Database["public"]["Tables"]["persona"]["Update"];

export interface CriteriosBusqueda {
  curp?: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  fechaNacimiento?: string;
  sexo?: string;
  telefono?: string;
}

/** Cascada RF-110: CURP exacta → nombre difuso + fecha de nacimiento → teléfono. */
export async function buscarPersonas(criterios: CriteriosBusqueda) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("buscar_persona_similar", {
    p_curp: criterios.curp || undefined,
    p_nombre: criterios.nombre || undefined,
    p_apellido_paterno: criterios.apellidoPaterno || undefined,
    p_apellido_materno: criterios.apellidoMaterno || undefined,
    p_fecha_nacimiento: criterios.fechaNacimiento || undefined,
    p_sexo: criterios.sexo || undefined,
    p_telefono: criterios.telefono || undefined,
  });

  if (error) return { error: error.message };
  return { resultados: data ?? [] };
}

/** RF-113: expedientes previos de una persona ya conocida, con su dictamen. */
export async function historialPersona(personaId: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("expediente")
    .select(
      "id, estado, creado_en, jornada:jornada_id(clave, nombre), dictamen_etapa1(resultado, fecha)",
    )
    .eq("paciente_id", personaId)
    .eq("activo", true)
    .order("creado_en", { ascending: false });

  if (error) return { error: error.message };
  return { expedientes: data ?? [] };
}

/**
 * Frontera de confianza real para curp/telefono/correo: el formulario ya
 * valida antes de mandar, pero esta es la última parada antes de la base —
 * un cliente que se saltara la UI, o un futuro llamador, no debe poder
 * guardar un formato inválido solo porque nadie más lo revisó aquí.
 */
function errorDeFormato(datos: Record<string, unknown>): string | null {
  const { curp, telefono, correo } = datos;
  if (typeof curp === "string" && curp && !validarCurp(curp)) return "CURP inválida.";
  if (typeof telefono === "string" && telefono && !validarTelefono(telefono)) {
    return "El teléfono debe tener 10 dígitos.";
  }
  if (typeof correo === "string" && correo && !validarCorreo(correo)) return "Correo electrónico inválido.";
  return null;
}

export async function crearPersona(datos: PersonaInsert) {
  const errorFormato = errorDeFormato(datos);
  if (errorFormato) return { error: errorFormato };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("persona")
    .insert({ ...datos, creado_por: user?.id })
    .select()
    .single();

  if (error) return { error: error.message };
  return { persona: data };
}

const CAMPOS_EDITABLES = [
  "nombre",
  "apellido_paterno",
  "apellido_materno",
  "fecha_nacimiento",
  "sexo",
  "curp",
  "telefono",
  "telefono_alterno",
  "correo",
  "estado_geografico",
  "municipio",
  "localidad",
  "direccion",
] as const satisfies readonly (keyof PersonaUpdate)[];

/**
 * Solo acepta los campos de CAMPOS_EDITABLES, ignorando cualquier otra
 * cosa que venga en `datos`. El formulario ya manda un payload limpio,
 * pero esta acción es la frontera de confianza real: el cliente podría
 * mandar cualquier cosa (o un componente futuro podría reintroducir el
 * mismo error de mandar la fila completa, incluida nombre_normalizado —
 * una columna generada que Postgres rechaza en un UPDATE).
 */
export async function actualizarPersona(id: string, datos: PersonaUpdate) {
  const limpio: Record<string, unknown> = {};
  for (const campo of CAMPOS_EDITABLES) {
    if (campo in datos) limpio[campo] = datos[campo];
  }

  const errorFormato = errorDeFormato(limpio);
  if (errorFormato) return { error: errorFormato };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("persona").update(limpio as PersonaUpdate).eq("id", id);

  if (error) return { error: error.message };
  return { exito: true, guardadoEn: new Date().toISOString() };
}

/**
 * Vincula responsable + crea expediente (RF-120, RF-125). Si el paciente ya
 * tiene expediente activo en esta jornada, lo reutiliza en vez de duplicar
 * (el índice único expediente_paciente_jornada_unico lo impediría de todas
 * formas — esto solo evita el error y regresa al expediente correcto).
 */
export async function crearExpedienteConResponsable(input: {
  pacienteId: string;
  responsableId: string;
  parentesco: string;
  jornadaId: string;
}) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: errorVinculo } = await supabase.from("paciente_responsable").upsert(
    {
      paciente_id: input.pacienteId,
      responsable_id: input.responsableId,
      parentesco: input.parentesco,
    },
    { onConflict: "paciente_id,responsable_id" },
  );
  if (errorVinculo) return { error: errorVinculo.message };

  const { data: existente } = await supabase
    .from("expediente")
    .select("id")
    .eq("paciente_id", input.pacienteId)
    .eq("jornada_id", input.jornadaId)
    .eq("activo", true)
    .maybeSingle();

  if (existente) return { expedienteId: existente.id, yaExistia: true };

  const { data: expediente, error: errorExpediente } = await supabase
    .from("expediente")
    .insert({ paciente_id: input.pacienteId, jornada_id: input.jornadaId, creado_por: user?.id })
    .select("id")
    .single();

  if (errorExpediente) return { error: errorExpediente.message };
  return { expedienteId: expediente.id, yaExistia: false };
}

/**
 * Guarda una sección catalogada (antecedentes | socioeconómico) y
 * recalcula si el expediente ya puede pasar a 'completo' (RF-124).
 *
 * Solo se toca la transición borrador ⟷ completo. Un expediente
 * 'dictaminado' nunca se toca aquí: editar una sección después del
 * dictamen no debe hacerlo desaparecer de la vista del médico.
 */
export async function guardarSeccion(
  expedienteId: string,
  seccion: "antecedentes" | "socioeconomico",
  datos: Record<string, unknown>,
  completa: boolean,
) {
  const supabase = await crearClienteServidor();

  const { error: errorSeccion } = await supabase.from("expediente_seccion").upsert(
    {
      expediente_id: expedienteId,
      seccion,
      datos: datos as Database["public"]["Tables"]["expediente_seccion"]["Row"]["datos"],
      completa,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "expediente_id,seccion" },
  );
  if (errorSeccion) return { error: errorSeccion.message };

  const { data: expediente } = await supabase
    .from("expediente")
    .select("id, estado, paciente_id")
    .eq("id", expedienteId)
    .single();

  if (expediente && expediente.estado !== "dictaminado") {
    const [{ data: secciones }, { count: responsables }] = await Promise.all([
      supabase.from("expediente_seccion").select("seccion, completa").eq("expediente_id", expedienteId),
      supabase
        .from("paciente_responsable")
        .select("*", { count: "exact", head: true })
        .eq("paciente_id", expediente.paciente_id),
    ]);

    const antecedentesOk = secciones?.some((s) => s.seccion === "antecedentes" && s.completa) ?? false;
    const socioeconomicoOk = secciones?.some((s) => s.seccion === "socioeconomico" && s.completa) ?? false;
    const tieneResponsable = (responsables ?? 0) > 0;
    const todoCompleto = antecedentesOk && socioeconomicoOk && tieneResponsable;

    const nuevoEstado = todoCompleto ? "completo" : "borrador";
    if (nuevoEstado !== expediente.estado) {
      await supabase.from("expediente").update({ estado: nuevoEstado }).eq("id", expedienteId);
    }
  }

  return { exito: true };
}

/**
 * RF-181: el pre-registro nunca se convierte solo en expediente. El
 * capturista lo revisa contra la familia que tiene enfrente y lo promueve
 * pasando por el asistente de alta — donde la deduplicación (RF-110) puede
 * reconocer a alguien que ya vino hace seis meses. Estas dos acciones solo
 * cierran el ciclo de la bandeja.
 *
 * No lleva función SECURITY DEFINER, a diferencia de `registrar_dictamen()`:
 * ahí hacían falta porque tres escrituras debían fallar juntas. Aquí el
 * expediente ya existe y está confirmado; esto es un único UPDATE que la
 * política `capturistas_actualizan_pre_registro` ya permite. Envolverlo en
 * SECURITY DEFINER sería dar privilegio sin necesitarlo.
 */
export async function vincularPreRegistro(preRegistroId: string, expedienteId: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("pre_registro")
    .update({ estado: "validado", expediente_id: expedienteId })
    .eq("id", preRegistroId);

  if (error) return { error: error.message };
  return { exito: true };
}

export async function descartarPreRegistro(preRegistroId: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("pre_registro")
    .update({ estado: "descartado" })
    .eq("id", preRegistroId);

  if (error) return { error: error.message };
  return { exito: true };
}

const TIPOS_CONSENTIMIENTO = ["aviso_privacidad", "deslinde", "uso_imagen"] as const;
const TIPOS_DOCUMENTO = [
  "acta",
  "curp",
  "ine_responsable",
  "comprobante_domicilio",
  "estudio_previo",
] as const;

/**
 * RF-160/161/163: sube el escaneo/foto del consentimiento firmado y liga el
 * expediente. La ruta es fija por (expediente, tipo) para que resubir el
 * mismo documento (una foto salió borrosa) lo reemplace en el bucket en vez
 * de acumular archivos huérfanos; la fila en `consentimiento` usa upsert
 * por el mismo motivo, apoyándose en su unique(expediente_id, tipo).
 */
export async function subirConsentimiento(formData: FormData) {
  const expedienteId = String(formData.get("expedienteId") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const archivo = formData.get("archivo");

  if (!expedienteId || !(TIPOS_CONSENTIMIENTO as readonly string[]).includes(tipo)) {
    return { error: "Datos inválidos." };
  }
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona una imagen." };
  }

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = `${expedienteId}/consentimiento-${tipo}.jpg`;
  const { error: errorSubida } = await supabase.storage
    .from("papeleria")
    .upload(ruta, archivo, { upsert: true, contentType: "image/jpeg" });
  if (errorSubida) return { error: errorSubida.message };

  const { error: errorFila } = await supabase.from("consentimiento").upsert(
    {
      expediente_id: expedienteId,
      tipo: tipo as (typeof TIPOS_CONSENTIMIENTO)[number],
      archivo_path: ruta,
      firmado_en: new Date().toISOString().slice(0, 10),
      capturado_por: user?.id,
    },
    { onConflict: "expediente_id,tipo" },
  );
  if (errorFila) return { error: errorFila.message };

  return { exito: true };
}

/** RF-164: documentos de soporte. A diferencia del consentimiento, admite varios por tipo. */
export async function subirDocumento(formData: FormData) {
  const expedienteId = String(formData.get("expedienteId") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const archivo = formData.get("archivo");

  if (!expedienteId || !(TIPOS_DOCUMENTO as readonly string[]).includes(tipo)) {
    return { error: "Datos inválidos." };
  }
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona una imagen." };
  }

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = `${expedienteId}/documento-${tipo}-${Date.now()}.jpg`;
  const { error: errorSubida } = await supabase.storage
    .from("papeleria")
    .upload(ruta, archivo, { contentType: "image/jpeg" });
  if (errorSubida) return { error: errorSubida.message };

  const { error: errorFila } = await supabase.from("documento").insert({
    expediente_id: expedienteId,
    tipo: tipo as (typeof TIPOS_DOCUMENTO)[number],
    archivo_path: ruta,
    subido_por: user?.id,
  });
  if (errorFila) return { error: errorFila.message };

  return { exito: true };
}
