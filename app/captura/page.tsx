import Link from "next/link";

import { obtenerJornadaActiva } from "@/lib/jornada";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EstadoExpediente } from "@/lib/supabase/tipos";

export const dynamic = "force-dynamic";

const ETIQUETA_ESTADO: Record<EstadoExpediente, { texto: string; variante: "secondary" | "default" }> = {
  borrador: { texto: "Borrador", variante: "secondary" },
  completo: { texto: "Completo", variante: "default" },
  dictaminado: { texto: "Dictaminado", variante: "default" },
};

export default async function PaginaCaptura() {
  const jornada = await obtenerJornadaActiva();

  if (!jornada) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>No hay jornada activa</CardTitle>
            <CardDescription>
              Un administrativo debe crear o activar una jornada en Etapa 1 antes de poder
              capturar expedientes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const supabase = await crearClienteServidor();
  const [{ data: expedientes }, { count: preRegistrosPendientes }] = await Promise.all([
    supabase
      .from("expediente")
      .select("id, estado, creado_en, persona:paciente_id(nombre, apellido_paterno, apellido_materno), folio(folio_texto, servicio, activo)")
      .eq("jornada_id", jornada.id)
      .eq("activo", true)
      .order("creado_en", { ascending: false }),
    supabase
      .from("pre_registro")
      .select("id", { count: "exact", head: true })
      .eq("estado", "nuevo"),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Captura</h1>
          <p className="text-muted-foreground">{jornada.nombre}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/captura/pre-registros" />}>
            Pre-registros
            {(preRegistrosPendientes ?? 0) > 0 ? (
              <Badge variant="secondary" className="ml-2">
                {preRegistrosPendientes}
              </Badge>
            ) : null}
          </Button>
          <Button nativeButton={false} render={<Link href="/captura/nuevo" />}>
            Nuevo expediente
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Folio</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(expedientes ?? []).map((exp) => {
                const persona = Array.isArray(exp.persona) ? exp.persona[0] : exp.persona;
                const folioActivo = (Array.isArray(exp.folio) ? exp.folio : [exp.folio]).find(
                  (f) => f?.activo,
                );
                const info = ETIQUETA_ESTADO[exp.estado];
                return (
                  <TableRow key={exp.id}>
                    <TableCell className="font-medium">
                      {persona ? `${persona.nombre} ${persona.apellido_paterno} ${persona.apellido_materno ?? ""}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={info.variante}>{info.texto}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{folioActivo?.folio_texto ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(exp.creado_en).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/captura/${exp.id}`} />}>
                        Continuar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {(expedientes ?? []).length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              Todavía no hay expedientes en esta jornada.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
