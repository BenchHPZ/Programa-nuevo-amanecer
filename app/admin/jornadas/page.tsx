import { crearClienteServidor } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { FilaJornada } from "./fila-jornada";
import { FormularioNuevaJornada } from "./formulario-nueva";

export const dynamic = "force-dynamic";

export default async function PaginaJornadas() {
  const supabase = await crearClienteServidor();
  const { data: jornadas } = await supabase
    .from("jornada")
    .select("id, clave, nombre, sede, fecha_inicio_etapa1, fecha_fin_etapa1, estado")
    .order("fecha_inicio_etapa1", { ascending: false });

  const activas = (jornadas ?? []).filter((j) => j.estado === "etapa1");

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Jornadas</h1>
        <p className="text-muted-foreground">
          La captura solo funciona si hay una jornada en <strong>Etapa 1 — en curso</strong>.
        </p>
      </div>

      {activas.length === 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base">Ninguna jornada está en Etapa 1</CardTitle>
            <CardDescription>
              Crea la jornada y cambia su estado a &quot;Etapa 1 — en curso&quot; para que
              aparezca en /captura.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {activas.length > 1 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base">Hay {activas.length} jornadas en Etapa 1 a la vez</CardTitle>
            <CardDescription>
              No debería pasar. Deja solo una activa para evitar confusión sobre a cuál se están
              cargando los expedientes nuevos.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nueva jornada</CardTitle>
        </CardHeader>
        <CardContent>
          <FormularioNuevaJornada />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Fechas etapa 1</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(jornadas ?? []).map((jornada) => (
                <FilaJornada key={jornada.id} jornada={jornada} />
              ))}
            </TableBody>
          </Table>
          {(jornadas ?? []).length === 0 && (
            <p className="py-8 text-center text-muted-foreground">Todavía no hay jornadas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
