"use server";

import { crearClienteServidor } from "@/lib/supabase/server";
import type { ResultadoDictamen } from "@/lib/supabase/tipos";

/**
 * Requerimiento original (nunca construido): foto del paciente tomada en
 * campo. Es un `documento` más (tipo 'foto_paciente'), pero la sube el
 * médico, no el capturista — al revés que el resto de `documento` — así
 * que vive en sus propias acciones, no en app/captura/acciones.ts. RLS
 * (medicos_crean_foto_paciente) es quien de verdad hace cumplir esto; aquí
 * solo se fija el tipo para que no se pueda mandar otro por error.
 *
 * Sin ruta fija ni upsert: igual que el resto de `documento`, cada subida
 * es una fila nueva (nunca se borra nada en este sistema). Quien la muestra
 * toma la más reciente.
 */
export async function subirFotoPaciente(formData: FormData) {
  const expedienteId = String(formData.get("expedienteId") ?? "");
  const archivo = formData.get("archivo");

  if (!expedienteId) return { error: "Datos inválidos." };
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Selecciona una imagen." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  });
  if (errorFila) return { error: errorFila.message };

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
