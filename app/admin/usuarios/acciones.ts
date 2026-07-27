"use server";

import { revalidatePath } from "next/cache";

import { crearClienteServidor } from "@/lib/supabase/server";
import type { RolUsuario } from "@/lib/supabase/tipos";

/**
 * La autorización real vive en RLS (solo_administrativo_modifica_perfiles,
 * migración 20260727090100). Estas acciones no necesitan reverificar el rol:
 * si quien las invoca no es administrativo, la base de datos rechaza el
 * UPDATE y `error` viene poblado.
 */

export async function aprobarUsuario(id: string, rol: RolUsuario) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("usuario_perfil")
    .update({ estado: "activo", rol, aprobado_por: user?.id, aprobado_en: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/usuarios");
  return { exito: true };
}

export async function suspenderUsuario(id: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("usuario_perfil").update({ estado: "suspendido" }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/usuarios");
  return { exito: true };
}

export async function reactivarUsuario(id: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("usuario_perfil").update({ estado: "activo" }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/usuarios");
  return { exito: true };
}
