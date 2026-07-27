"use server";

import { revalidatePath } from "next/cache";

import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoJornada } from "@/lib/supabase/tipos";

export async function crearJornada(_estadoPrevio: unknown, formData: FormData) {
  const clave = String(formData.get("clave") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const sede = String(formData.get("sede") ?? "").trim();
  const fecha_inicio_etapa1 = String(formData.get("fecha_inicio_etapa1") ?? "");
  const fecha_fin_etapa1 = String(formData.get("fecha_fin_etapa1") ?? "");
  const fecha_etapa2 = String(formData.get("fecha_etapa2") ?? "") || null;
  const estado = String(formData.get("estado") ?? "planeada") as EstadoJornada;

  if (!clave || !nombre || !sede || !fecha_inicio_etapa1 || !fecha_fin_etapa1) {
    return { error: "Clave, nombre, sede y fechas de la etapa 1 son obligatorios." };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("jornada").insert({
    clave,
    nombre,
    sede,
    fecha_inicio_etapa1,
    fecha_fin_etapa1,
    fecha_etapa2,
    estado,
  });

  if (error) {
    return { error: error.message.includes("duplicate") ? "Ya existe una jornada con esa clave." : error.message };
  }

  revalidatePath("/admin/jornadas");
  return { exito: true };
}

export async function cambiarEstadoJornada(id: string, estado: EstadoJornada) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("jornada").update({ estado }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/jornadas");
  return { exito: true };
}
