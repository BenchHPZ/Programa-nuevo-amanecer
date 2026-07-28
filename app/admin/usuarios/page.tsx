import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { FilaUsuario } from "./fila-usuario";

export const dynamic = "force-dynamic";

export default async function PaginaUsuarios() {
  const supabase = await crearClienteServidor();
  const {
    data: { user: usuarioActual },
  } = await supabase.auth.getUser();

  const { data: perfiles, error } = await supabase
    .from("usuario_perfil")
    .select("id, nombre, rol, estado, creado_en")
    .order("estado", { ascending: true })
    .order("creado_en", { ascending: false });

  if (error) {
    return <p className="p-8 text-destructive">No se pudo cargar la lista: {error.message}</p>;
  }

  // usuario_perfil no guarda correo (vive en auth.users). Se completa aquí
  // con el cliente de servicio, solo en este componente de servidor.
  const admin = crearClienteAdmin();
  const { data: listaAuth } = await admin.auth.admin.listUsers({ perPage: 200 });
  const correoPorId = new Map(listaAuth?.users.map((u) => [u.id, u.email ?? "—"]));

  const usuarios = (perfiles ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    correo: correoPorId.get(p.id) ?? "—",
    rol: p.rol,
    estado: p.estado,
  }));

  const pendientes = usuarios.filter((u) => u.estado === "pendiente");

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-muted-foreground">
          Aprobar, asignar rol o suspender acceso. Un usuario sin aprobar no ve ningún dato
          (RN-10) — el control real lo aplica la base de datos, no esta pantalla.
        </p>
      </div>

      {pendientes.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base">
              {pendientes.length} usuario{pendientes.length === 1 ? "" : "s"} esperando aprobación
            </CardTitle>
            <CardDescription>
              Antes del ensayo general (2 de agosto), confirmar que los 5 capturistas y el
              personal médico queden aprobados con su rol correcto.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((usuario) => (
                <FilaUsuario key={usuario.id} usuario={usuario} usuarioActualId={usuarioActual?.id ?? ""} />
              ))}
            </TableBody>
          </Table>
          {usuarios.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">Todavía no hay usuarios registrados.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
