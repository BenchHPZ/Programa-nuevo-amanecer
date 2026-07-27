"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { leerCsv } from "@/lib/csv";
import { filasImportables, type FilaAnalizada } from "@/lib/importacion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { analizarImportacion, ejecutarImportacion } from "./acciones";

interface Resumen {
  importadas: number;
  omitidas: number;
  fallidas: { linea: number; error: string }[];
}

export function Importador() {
  const router = useRouter();
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [analizadas, setAnalizadas] = useState<FilaAnalizada[] | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enProceso, iniciarTransicion] = useTransition();

  function elegirArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    setError(null);
    setResumen(null);
    setAnalizadas(null);
    setNombreArchivo(archivo.name);

    archivo.text().then((texto) => {
      const { filas, error: errorLectura } = leerCsv(texto);
      if (errorLectura) {
        setError(errorLectura);
        return;
      }
      iniciarTransicion(async () => {
        const r = await analizarImportacion(filas);
        setAnalizadas(r.filas);
      });
    });
  }

  function confirmar() {
    if (!analizadas) return;
    setError(null);
    iniciarTransicion(async () => {
      const r = await ejecutarImportacion(analizadas.map((f) => f.datos));
      if ("error" in r && r.error) {
        setError(r.error);
        return;
      }
      setResumen(r as Resumen);
      setAnalizadas(null);
      router.refresh();
    });
  }

  const listas = analizadas ? filasImportables(analizadas) : [];
  const conErrores = analizadas ? analizadas.filter((f) => f.errores.length > 0) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Elegir el archivo</CardTitle>
          <CardDescription>
            Usa la plantilla para que las columnas coincidan. Nada se guarda hasta que confirmes
            en el paso 2.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={elegirArchivo}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm"
          />
          {nombreArchivo ? (
            <p className="text-sm text-muted-foreground">Archivo: {nombreArchivo}</p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {enProceso && !analizadas ? (
            <p className="text-sm text-muted-foreground">Revisando el archivo…</p>
          ) : null}
        </CardContent>
      </Card>

      {resumen && (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardHeader>
            <CardTitle className="text-base">
              {resumen.importadas} expediente{resumen.importadas === 1 ? "" : "s"} importado
              {resumen.importadas === 1 ? "" : "s"}
            </CardTitle>
            <CardDescription>
              {resumen.omitidas > 0
                ? `${resumen.omitidas} fila(s) se omitieron por errores. Corrígelas y vuelve a subir solo esas.`
                : "Todas las filas del archivo entraron."}
            </CardDescription>
          </CardHeader>
          {resumen.fallidas.length > 0 && (
            <CardContent>
              <p className="mb-2 text-sm font-medium text-destructive">
                Filas rechazadas por la base de datos:
              </p>
              {resumen.fallidas.map((f) => (
                <p key={f.linea} className="text-sm text-muted-foreground">
                  Línea {f.linea}: {f.error}
                </p>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {analizadas && (
        <Card>
          <CardHeader>
            <CardTitle>2. Revisar antes de guardar</CardTitle>
            <CardDescription>
              {listas.length} fila{listas.length === 1 ? "" : "s"} lista
              {listas.length === 1 ? "" : "s"} para importar
              {conErrores.length > 0
                ? ` · ${conErrores.length} con errores, que se van a omitir`
                : ""}
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Línea</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Revisión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analizadas.map((fila) => (
                  <TableRow key={fila.linea}>
                    <TableCell className="text-muted-foreground">{fila.linea}</TableCell>
                    <TableCell>
                      {`${fila.datos.nombre ?? ""} ${fila.datos.apellido_paterno ?? ""} ${fila.datos.apellido_materno ?? ""}`.trim() ||
                        "—"}
                      <span className="block text-xs text-muted-foreground">
                        {fila.datos.fecha_nacimiento || "sin fecha"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {`${fila.datos.responsable_nombre ?? ""} ${fila.datos.responsable_apellido_paterno ?? ""}`.trim() ||
                        "—"}
                      <span className="block text-xs text-muted-foreground">
                        {fila.datos.parentesco || "sin parentesco"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {fila.errores.length > 0 ? (
                        <div className="space-y-1">
                          {fila.errores.map((e) => (
                            <p key={e} className="text-xs text-destructive">
                              {e}
                            </p>
                          ))}
                        </div>
                      ) : fila.posiblesDuplicados.length > 0 ? (
                        <div className="space-y-1">
                          <Badge variant="secondary">Ya existe alguien parecido</Badge>
                          {fila.posiblesDuplicados.map((d) => (
                            <p key={d.nombre} className="text-xs text-muted-foreground">
                              {d.nombre}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin observaciones</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {analizadas.some((f) => f.posiblesDuplicados.length > 0) && (
              <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
                Las coincidencias se importan igual, como personas nuevas: unir registros
                automáticamente es más difícil de deshacer que conciliarlos después. Solo se
                reutiliza una persona existente cuando la CURP es idéntica.
              </p>
            )}

            <Button onClick={confirmar} disabled={enProceso || listas.length === 0}>
              {enProceso
                ? "Importando…"
                : `Importar ${listas.length} fila${listas.length === 1 ? "" : "s"}`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
