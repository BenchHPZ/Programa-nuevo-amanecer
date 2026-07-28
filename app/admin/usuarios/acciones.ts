"use server";

import { revalidatePath } from "next/cache";

import { construirRedirectTo } from "@/lib/auth-enlaces";
import { verificarEsAdministrativo } from "@/lib/autorizacion";
import { crearClienteAdmin } from "@/lib/supabase/admin";
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

/**
 * Corrige el rol de alguien que ya está activo — a diferencia de
 * aprobarUsuario(), no toca estado ni aprobado_por/aprobado_en: esto no es
 * una aprobación nueva, es una corrección sobre una que ya existía.
 */
export async function cambiarRolUsuario(id: string, rol: RolUsuario) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("usuario_perfil").update({ rol }).eq("id", id);

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

/**
 * Genera un enlace temporal para que alguien fije una contraseña nueva, sin
 * depender de que le llegue un correo — el panel lo muestra para copiarlo.
 * Usa el cliente de servicio (auth.admin no existe en el cliente normal),
 * así que aquí sí hace falta reverificar el rol a mano: nada de RLS lo hace
 * por nosotros.
 */
export async function generarEnlaceRestablecimiento(correo: string) {
  const autorizado = await verificarEsAdministrativo();
  if (!autorizado.ok) return { error: autorizado.error };

  const admin = crearClienteAdmin();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: correo,
    options: { redirectTo: await construirRedirectTo() },
  });

  if (error) return { error: error.message };
  return { enlace: data.properties.action_link };
}
