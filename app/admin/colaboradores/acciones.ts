"use server";

import { revalidatePath } from "next/cache";

import { construirRedirectTo } from "@/lib/auth-enlaces";
import { verificarEsAdministrativo } from "@/lib/autorizacion";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database, RolUsuario } from "@/lib/supabase/tipos";
import { validarCorreo } from "@/lib/validaciones";

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

/**
 * Invita a un colaborador ya registrado a tener cuenta en el sistema, con
 * rol asignado de una vez — el admin, al invitar con un rol, ya está
 * aprobando: no pasa por 'pendiente'. Usa el cliente de servicio porque
 * auth.admin no existe en el cliente normal, así que aquí sí hace falta
 * reverificar el rol a mano (nada de RLS lo hace por nosotros).
 */
export async function invitarColaborador(
  colaboradorId: string,
  correo: string,
  nombre: string,
  rol: RolUsuario,
) {
  if (!correo || !validarCorreo(correo)) return { error: "Este colaborador no tiene un correo válido." };
  if (!nombre.trim()) return { error: "Falta el nombre." };

  const autorizado = await verificarEsAdministrativo();
  if (!autorizado.ok) return { error: autorizado.error };

  const admin = crearClienteAdmin();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: correo,
    options: { data: { nombre }, redirectTo: await construirRedirectTo() },
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("already exists")) {
      return { error: "Ese correo ya tiene una cuenta en el sistema." };
    }
    return { error: error.message };
  }

  const nuevoUsuarioId = data.user.id;

  const { error: errorPerfil } = await admin
    .from("usuario_perfil")
    .update({
      rol,
      estado: "activo",
      aprobado_por: autorizado.id,
      aprobado_en: new Date().toISOString(),
    })
    .eq("id", nuevoUsuarioId);
  if (errorPerfil) return { error: errorPerfil.message };

  const { error: errorColaborador } = await admin
    .from("registro_colaborador")
    .update({ usuario_id: nuevoUsuarioId, estado: "aceptado" })
    .eq("id", colaboradorId);
  if (errorColaborador) return { error: errorColaborador.message };

  revalidatePath("/admin/colaboradores");
  return { enlace: data.properties.action_link };
}
