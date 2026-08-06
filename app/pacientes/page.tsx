import Link from "next/link";

import { consultarExpedientes } from "@/lib/expedientes";
import { obtenerJornadaActiva } from "@/lib/jornada";
import { rolActual } from "@/lib/permisos";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { ETIQUETA_ESTADO, ETIQUETA_RESULTADO, ETIQUETA_SERVICIO } from "../admin/expedientes/filtros";

export const dynamic = "force-dynamic";

const POR_PAGINA = 100;

/**
 * Quién ve cada botón por fila — espejo en la UI de lo que las páginas de
 * destino (`/captura/[id]`, `/dictamen/[id]`, `/pacientes/[id]`) ya exigen
 * o, en el caso de captura, de lo que RLS ya permite (`puede_escribir()`
 * incluye capturista/administrativo/medico_triage). El informista no tiene
 * ninguna facultad de escritura: solo Vista.
 */
const VE_CAPTURA = new Set(["capturista", "medico_triage", "administrativo"]);
const VE_DICTAMINAR = new Set(["medico_triage", "administrativo"]);

export default async function PaginaPacientes() {
  const supabase = await crearClienteServidor();
  const jornada = await obtenerJornadaActiva();
  const rol = await rolActual(supabase);

  if (!jornada) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>No hay jornada activa</CardTitle>
            <CardDescription>
              Los pacientes se listan por jornada. Un administrativo debe crear o activar una
              jornada en Etapa 1.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const veCaptura = rol ? VE_CAPTURA.has(rol) : false;
  const veDictaminar = rol ? VE_DICTAMINAR.has(rol) : false;

  const { expedientes, total, error } = await consultarExpedientes(jornada.id, {}, {
    limite: POR_PAGINA,
    desplazamiento: 0,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          <p className="text-muted-foreground">{jornada.nombre}</p>
        </div>
        <div className="flex gap-2">
          {rol === "administrativo" && (
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/expedientes" />}>
              Padrón con filtros
            </Button>
          )}
          {veCaptura && (
            <Button nativeButton={false} render={<Link href="/captura/nuevo" />}>
              Nuevo paciente
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {total} paciente{total === 1 ? "" : "s"} registrado{total === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="py-8 text-center text-destructive">No se pudo consultar: {error}</p>
          ) : expedientes.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Todavía no hay pacientes registrados en esta jornada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                  <TableHead>Dictamen</TableHead>
                  <TableHead>Folio</TableHead>
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
                      <TableCell>
                        <Badge variant={exp.estado === "dictaminado" ? "default" : "secondary"}>
                          {ETIQUETA_ESTADO[exp.estado] ?? exp.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {veCaptura && (
                            <Button
                              variant="outline"
                              size="sm"
                              nativeButton={false}
                              render={<Link href={`/captura/${exp.id}`} />}
                            >
                              Captura
                            </Button>
                          )}
                          {veDictaminar && (
                            <Button
                              variant="outline"
                              size="sm"
                              nativeButton={false}
                              render={<Link href={`/dictamen/${exp.id}`} />}
                            >
                              Dictaminar
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={`/pacientes/${exp.id}`} />}
                          >
                            Vista
                          </Button>
                        </div>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {total > POR_PAGINA && (
            <p className="pt-4 text-center text-xs text-muted-foreground">
              Mostrando los primeros {POR_PAGINA} de {total}.{" "}
              {rol === "administrativo" ? (
                <Link href="/admin/expedientes" className="underline underline-offset-2">
                  Usa el padrón con filtros
                </Link>
              ) : (
                "Pide a un administrativo que filtre el padrón si necesitas ver más."
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
