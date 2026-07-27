"use server";

import { crearClienteServidor } from "@/lib/supabase/server";
import type { ResultadoDictamen } from "@/lib/supabase/tipos";

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
