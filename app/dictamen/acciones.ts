"use server";

import { crearClienteServidor } from "@/lib/supabase/server";
import type { ResultadoDictamen, VistaFoto } from "@/lib/supabase/tipos";

const VISTAS_VALIDAS: VistaFoto[] = ["anterior", "lateral_derecha", "lateral_izquierda"];
const MAX_FOTOS_POR_VISTA = 3;

/**
 * Requerimiento original (nunca construido): foto del paciente tomada en
 * campo. Es un `documento` más (tipo 'foto_paciente'), pero la sube el
 * médico, no el capturista — al revés que el resto de `documento` — así
 * que vive en sus propias acciones, no en app/captura/acciones.ts. RLS
 * (medicos_crean_foto_paciente) es quien de verdad hace cumplir esto; aquí
 * solo se fija el tipo para que no se pueda mandar otro por error.
 *
 * Sin ruta fija ni upsert: igual que el resto de `documento`, cada subida
 * es una fila nueva (nunca se borra nada en este sistema). Se organizan en
 * 3 vistas fijas, máximo 3 fotos activas por vista — el límite se checa
 * aquí (conteo) porque no hay forma sencilla de expresarlo como constraint
 * de base de datos sin un trigger; una carrera muy poco probable (dos
 * subidas casi simultáneas) podría dejar pasar una 4ª foto.
 */
export async function subirFotoPaciente(formData: FormData) {
  const expedienteId = String(formData.get("expedienteId") ?? "");
  const archivo = formData.get("archivo");
  const vista = String(formData.get("vista") ?? "") as VistaFoto;

  if (!expedienteId) return { error: "Datos inválidos." };
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Selecciona una imagen." };
  if (!VISTAS_VALIDAS.includes(vista)) return { error: "Vista inválida." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count } = await supabase
    .from("documento")
    .select("id", { count: "exact", head: true })
    .eq("expediente_id", expedienteId)
    .eq("tipo", "foto_paciente")
    .eq("vista_foto", vista)
    .eq("activo", true);
  if ((count ?? 0) >= MAX_FOTOS_POR_VISTA) {
    return { error: `Ya hay ${MAX_FOTOS_POR_VISTA} fotos para esta vista.` };
  }

  const ruta = `${expedienteId}/foto-paciente-${Date.now()}.jpg`;
  const { error: errorSubida } = await supabase.storage
    .from("papeleria")
    .upload(ruta, archivo, { contentType: "image/jpeg" });
  if (errorSubida) return { error: errorSubida.message };

  const { error: errorFila } = await supabase.from("documento").insert({
    expediente_id: expedienteId,
    tipo: "foto_paciente",
    archivo_path: ruta,
    subido_por: user?.id,
    vista_foto: vista,
  });
  if (errorFila) return { error: errorFila.message };

  return { exito: true };
}

/**
 * "Eliminar" una foto = borrado lógico (activo = false), nunca DELETE — la
 * misma regla que rige todo el sistema (NOM-004). RLS
 * (medicos_desactivan_foto_paciente) exige medico_triage/administrativo;
 * si la fila no se actualiza (0 filas) es casi siempre por ahí.
 */
export async function desactivarFotoPaciente(documentoId: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("documento")
    .update({ activo: false })
    .eq("id", documentoId)
    .eq("tipo", "foto_paciente")
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "No se pudo eliminar (sin permiso o la foto ya no existe)." };
  return { exito: true };
}

/**
 * RF-140 a RF-144: registra el dictamen, transiciona el expediente a
 * 'dictaminado' y, si el resultado es apto, asigna folio — todo en una sola
 * llamada atómica (ver función registrar_dictamen en supabase/migrations).
 */
export async function registrarDictamen(input: {
  expedienteId: string;
  resultado: ResultadoDictamen;
  observaciones: string;
  recomendacion: string;
}) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("registrar_dictamen", {
    p_expediente_id: input.expedienteId,
    p_resultado: input.resultado,
    p_observaciones: input.observaciones.trim() || undefined,
    p_recomendacion:
      input.resultado === "no_apto" ? input.recomendacion.trim() || undefined : undefined,
  });

  if (error) return { error: error.message };
  const fila = Array.isArray(data) ? data[0] : data;
  return { exito: true, folioTexto: fila?.folio?.folio_texto ?? null };
}

/**
 * Corrige un dictamen ya registrado (resultado y observaciones). Solo
 * medico_triage/administrativo (RLS + tiene_rol en modificar_dictamen). Si
 * la salida cambia de categoría de folio, la función anula el folio
 * anterior (nunca se borra) y asigna uno nuevo en su propia serie.
 */
export async function modificarDictamen(input: {
  expedienteId: string;
  resultado: ResultadoDictamen;
  observaciones: string;
  recomendacion: string;
}) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("modificar_dictamen", {
    p_expediente_id: input.expedienteId,
    p_resultado: input.resultado,
    p_observaciones: input.observaciones.trim() || undefined,
    p_recomendacion:
      input.resultado === "no_apto" ? input.recomendacion.trim() || undefined : undefined,
  });

  if (error) return { error: error.message };
  const fila = Array.isArray(data) ? data[0] : data;
  return { exito: true, folioTexto: fila?.folio?.folio_texto ?? null };
}
