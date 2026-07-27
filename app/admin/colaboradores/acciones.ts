"use server";

import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/tipos";

type EstadoColaborador = Database["public"]["Enums"]["estado_colaborador"];

const ESTADOS: EstadoColaborador[] = ["nuevo", "contactado", "aceptado", "descartado"];

export async function cambiarEstadoColaborador(id: string, estado: string) {
  if (!ESTADOS.includes(estado as EstadoColaborador)) {
    return { error: "Estado no válido." };
  }

  // La política `admin_actualiza_colaboradores` es la que manda: si quien
  // llama no es administrativo, este update no toca ninguna fila.
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("registro_colaborador")
    .update({ estado: estado as EstadoColaborador })
    .eq("id", id);

  if (error) return { error: error.message };
  return { exito: true };
}
