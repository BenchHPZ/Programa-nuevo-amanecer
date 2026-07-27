import { crearClienteServidor } from "@/lib/supabase/server";

/** RF-127: quién tocó este registro por última vez, y cuándo. */
export async function UltimaModificacion({ tabla, registroId }: { tabla: string; registroId: string }) {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("audit_log")
    .select("ts, accion, usuario_id")
    .eq("tabla", tabla)
    .eq("registro_id", registroId)
    .order("ts", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  let nombreUsuario = "sistema";
  if (data.usuario_id) {
    const { data: perfil } = await supabase
      .from("usuario_perfil")
      .select("nombre")
      .eq("id", data.usuario_id)
      .maybeSingle();
    nombreUsuario = perfil?.nombre ?? "usuario ya no disponible";
  }

  const ACCION: Record<string, string> = { INSERT: "creado", UPDATE: "modificado", DELETE: "eliminado" };

  return (
    <p className="text-xs text-muted-foreground">
      {ACCION[data.accion] ?? data.accion} por última vez el{" "}
      {new Date(data.ts).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })} —{" "}
      {nombreUsuario}
    </p>
  );
}
