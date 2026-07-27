import Link from "next/link";

import { consultarExpedientes, hayFiltros, leerFiltros } from "@/lib/expedientes";
import { obtenerJornadaActiva } from "@/lib/jornada";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
  ETIQUETA_ESTADO,
  ETIQUETA_RESULTADO,
  ETIQUETA_SERVICIO,
  FiltrosExpedientes,
} from "./filtros";

export const dynamic = "force-dynamic";

const POR_PAGINA = 50;

export default async function PaginaExpedientes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filtros = leerFiltros(sp);
  const pagina = Math.max(1, Number(typeof sp.pagina === "string" ? sp.pagina : "1") || 1);

  const jornada = await obtenerJornadaActiva();

  if (!jornada) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>No hay jornada activa</CardTitle>
            <CardDescription>
              El padrón se lista por jornada. Activa una jornada en Etapa 1 para verlo.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { expedientes, total, error } = await consultarExpedientes(jornada.id, filtros, {
    limite: POR_PAGINA,
    desplazamiento: (pagina - 1) * POR_PAGINA,
  });

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  // Se conservan los filtros al paginar y al exportar; si no, cambiar de
  // página o exportar reiniciaría el filtrado sin avisar.
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor) parametros.set(clave, valor);
  }
  const consultaFiltros = parametros.toString();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Expedientes</h1>
          <p className="text-muted-foreground">{jornada.nombre}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/admin" />}>
            Volver al panel
          </Button>
          <Button
            nativeButton={false}
            render={
              <a href={`/admin/exportar${consultaFiltros ? `?${consultaFiltros}` : ""}`} />
            }
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FiltrosExpedientes filtros={filtros} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {total} expediente{total === 1 ? "" : "s"}
            {hayFiltros(filtros) ? " con estos filtros" : " en la jornada"}
          </CardTitle>
          <CardDescription>
            La exportación respeta los filtros aplicados y queda registrada en la bitácora de
            auditoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="py-8 text-center text-destructive">No se pudo consultar: {error}</p>
          ) : expedientes.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Ningún expediente coincide con estos filtros.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Nacimiento</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Dictamen</TableHead>
                  <TableHead>Folio</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expedientes.map((exp) => {
                  const p = exp.paciente;
                  const folio = exp.folio?.find((f) => f.activo);
                  const dictamen = exp.dictamen_etapa1;
                  return (
                    <TableRow key={exp.id}>
                      <TableCell className="font-medium">
                        {p ? `${p.nombre} ${p.apellido_paterno} ${p.apellido_materno ?? ""}` : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p?.fecha_nacimiento ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p?.municipio ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={exp.estado === "dictaminado" ? "default" : "secondary"}>
                          {ETIQUETA_ESTADO[exp.estado] ?? exp.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {dictamen ? (
                          ETIQUETA_RESULTADO[dictamen.resultado] ?? dictamen.resultado
                        ) : (
                          <span className="text-muted-foreground">Sin dictamen</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {folio ? `${folio.folio_texto}-${folio.digito_verificador}` : "—"}
                        {folio ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            {ETIQUETA_SERVICIO[folio.servicio]}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={<Link href={`/captura/${exp.id}`} />}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Página {pagina} de {totalPaginas}
              </p>
              <div className="flex gap-2">
                {pagina > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link
                        href={`/admin/expedientes?${consultaFiltros}${consultaFiltros ? "&" : ""}pagina=${pagina - 1}`}
                      />
                    }
                  >
                    Anterior
                  </Button>
                )}
                {pagina < totalPaginas && (
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link
                        href={`/admin/expedientes?${consultaFiltros}${consultaFiltros ? "&" : ""}pagina=${pagina + 1}`}
                      />
                    }
                  >
                    Siguiente
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
