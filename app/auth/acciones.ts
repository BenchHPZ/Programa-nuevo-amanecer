"use server";

import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";
import type { RolUsuario } from "@/lib/supabase/tipos";

const DESTINO_POR_ROL: Record<RolUsuario, string> = {
  administrativo: "/admin",
  capturista: "/captura",
  informista: "/captura",
  medico_triage: "/dictamen",
  primer_contacto: "/",
  autorizador: "/",
  evaluador_prequirurgico: "/",
  programador: "/",
};

export async function registrarUsuario(_estadoPrevio: unknown, formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!nombre || !email || !password) {
    return { error: "Todos los campos son obligatorios." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  });

  if (error) {
    return { error: traducirErrorAuth(error.message) };
  }

  // Confirmación de correo activada: no hay sesión todavía.
  if (data.user && !data.session) {
    return {
      exito:
        "Cuenta creada. Revisa tu correo para confirmarla; después, un administrativo debe aprobar tu acceso.",
    };
  }

  redirect("/auth/pendiente-aprobacion");
}

export async function iniciarSesion(_estadoPrevio: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const siguiente = String(formData.get("siguiente") ?? "");

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: traducirErrorAuth(error.message) };
  }

  if (siguiente) {
    redirect(siguiente);
  }
  await redirigirSegunRol(supabase, data.user.id);
}

/**
 * A dónde manda el sistema a alguien ya autenticado, según su rol — usado
 * al iniciar sesión y también al terminar de fijar contraseña nueva desde
 * un enlace de invitación o restablecimiento (app/auth/nueva-contrasena).
 * `redirect()` de Next.js interrumpe la ejecución lanzando, así que esta
 * función nunca retorna normalmente para quien la llama.
 */
export async function redirigirSegunRol(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  usuarioId: string,
): Promise<never> {
  const { data: perfil } = await supabase
    .from("usuario_perfil")
    .select("estado, rol")
    .eq("id", usuarioId)
    .single();

  if (!perfil || perfil.estado !== "activo") {
    redirect("/auth/pendiente-aprobacion");
  }
  redirect(perfil.rol ? DESTINO_POR_ROL[perfil.rol] : "/");
}

/**
 * Termina el enlace de invitación o de restablecimiento de contraseña
 * (app/auth/callback ya intercambió el código por sesión antes de llegar
 * aquí). Exige sesión real — sin eso no hay a quién cambiarle la contraseña.
 */
export async function establecerNuevaContrasena(_estadoPrevio: unknown, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/iniciar-sesion");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: traducirErrorAuth(error.message) };
  }

  await redirigirSegunRol(supabase, user.id);
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/auth/iniciar-sesion");
}

function traducirErrorAuth(mensaje: string): string {
  if (mensaje.includes("Invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (mensaje.includes("already registered") || mensaje.includes("already exists")) {
    return "Ya existe una cuenta con ese correo.";
  }
  if (mensaje.includes("Password should be")) {
    return "La contraseña no cumple los requisitos mínimos.";
  }
  return mensaje;
}
