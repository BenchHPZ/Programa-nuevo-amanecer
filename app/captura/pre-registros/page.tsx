import Link from "next/link";

import { crearClienteServidor } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { FilaPreRegistro, type DatosPreRegistroGuardados } from "./fila-pre-registro";

export const dynamic = "force-dynamic";

interface FilaCruda {
  id: string;
  datos: DatosPreRegistroGuardados;
  creado_en: string;
}

/**
 * RF-181: bandeja de lo que llegó por la landing pública. Un pre-registro
 * NO es un expediente y no cuenta para nada hasta que un capturista lo
 * valida contra la persona que tiene enfrente.
 */
export default async function PaginaPreRegistros() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("pre_registro")
    .select("id, datos, creado_en")
    .eq("estado", "nuevo")
    .order("creado_en", { ascending: true });

  const pendientes = (data ?? []) as unknown as FilaCruda[];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pre-registros</h1>
          <p className="text-muted-foreground">
            Solicitudes recibidas por la página pública, en orden de llegada.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/captura" />}>
          Volver al listado
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendientes de validar</CardTitle>
          <CardDescription>
            Confirma los datos con la familia antes de promover. Al promover se abre el alta
            normal, con la búsqueda de duplicados: puede que la persona ya haya venido en una
            jornada anterior.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="py-8 text-center text-destructive">
              No se pudo cargar la bandeja: {error.message}
            </p>
          ) : pendientes.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay pre-registros pendientes.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Recibido</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendientes.map((fila) => (
                  <FilaPreRegistro
                    key={fila.id}
                    id={fila.id}
                    datos={fila.datos}
                    creadoEn={fila.creado_en}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
