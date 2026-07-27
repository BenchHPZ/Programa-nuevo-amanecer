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

  const { data: perfil } = await supabase
    .from("usuario_perfil")
    .select("estado, rol")
    .eq("id", data.user.id)
    .single();

  if (!perfil || perfil.estado !== "activo") {
    redirect("/auth/pendiente-aprobacion");
  }

  if (siguiente) {
    redirect(siguiente);
  }
  redirect(perfil.rol ? DESTINO_POR_ROL[perfil.rol] : "/");
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
