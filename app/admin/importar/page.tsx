import Link from "next/link";

import { COLUMNAS_OPCIONALES, COLUMNAS_REQUERIDAS } from "@/lib/importacion";
import { obtenerJornadaActiva } from "@/lib/jornada";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Importador } from "./importador";

export const dynamic = "force-dynamic";

export default async function PaginaImportar() {
  const jornada = await obtenerJornadaActiva();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Importar de contingencia</h1>
          <p className="text-muted-foreground">
            {jornada ? jornada.nombre : "Sin jornada activa"}
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin" />}>
          Volver al panel
        </Button>
      </div>

      {!jornada && (
        <Card>
          <CardHeader>
            <CardTitle>No hay jornada activa</CardTitle>
            <CardDescription>
              La importación necesita saber a qué jornada pertenecen los expedientes. Activa una
              jornada en Etapa 1 antes de continuar.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Formato del archivo</CardTitle>
          <CardDescription>
            CSV con encabezados en la primera línea. Mayúsculas y espacios en los encabezados no
            importan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Columnas obligatorias</p>
            <p className="text-muted-foreground">{COLUMNAS_REQUERIDAS.join(" · ")}</p>
          </div>
          <div>
            <p className="font-medium">Columnas opcionales</p>
            <p className="text-muted-foreground">{COLUMNAS_OPCIONALES.join(" · ")}</p>
          </div>
          <p className="text-muted-foreground">
            El expediente entra en estado <strong>borrador</strong>: la importación recupera la
            identidad y el contacto, no las secciones clínicas. Esas se completan después en la
            pantalla de captura.
          </p>
        </CardContent>
      </Card>

      {jornada && <Importador />}
    </div>
  );
}
