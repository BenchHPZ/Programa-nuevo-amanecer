import Link from "next/link";

import { obtenerJornadaActiva } from "@/lib/jornada";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EstadoExpediente, ResultadoDictamen } from "@/lib/supabase/tipos";

export const dynamic = "force-dynamic";

const ETIQUETA_RESULTADO: Record<ResultadoDictamen, { texto: string; variante: "default" | "secondary" | "destructive" }> = {
  apto_cirugia: { texto: "Apto — cirugía", variante: "default" },
  apto_laser: { texto: "Apto — láser", variante: "default" },
  no_apto: { texto: "No apto", variante: "destructive" },
  regresar_6_meses: { texto: "Regresar en 6 meses", variante: "secondary" },
};

interface Persona {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
}

/**
 * El select combina tres relaciones embebidas a la vez; postgrest-js deja
 * de inferir el tipo de la fila en ese caso y cae en `any` sin avisar en el
 * propio `.select()`. Se tipa explícito aquí, igual que ya se hace con las
 * columnas JSONB en otras páginas.
 */
interface FilaExpediente {
  id: string;
  estado: EstadoExpediente;
  creado_en: string;
  persona: Persona | Persona[] | null;
  dictamen_etapa1: { resultado: ResultadoDictamen } | { resultado: ResultadoDictamen }[] | null;
  folio: { folio_texto: string; activo: boolean } | { folio_texto: string; activo: boolean }[] | null;
}

export default async function PaginaDictamen() {
  const jornada = await obtenerJornadaActiva();

  if (!jornada) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>No hay jornada activa</CardTitle>
            <CardDescription>
              Un administrativo debe crear o activar una jornada en Etapa 1 antes de poder
              dictaminar expedientes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const supabase = await crearClienteServidor();
  const { data: filas } = await supabase
    .from("expediente")
    .select(
      "id, estado, creado_en, persona:paciente_id(nombre, apellido_paterno, apellido_materno), dictamen_etapa1(resultado), folio(folio_texto, activo)",
    )
    .eq("jornada_id", jornada.id)
    .eq("activo", true)
    .order("creado_en", { ascending: false });

  const expedientes = filas as unknown as FilaExpediente[] | null;

  const pendientes = (expedientes ?? []).filter((e) => e.estado === "completo");
  const dictaminados = (expedientes ?? []).filter((e) => e.estado === "dictaminado");
  const enCaptura = (expedientes ?? []).filter((e) => e.estado === "borrador");

  function nombrePersona(exp: (typeof pendientes)[number]) {
    const p = Array.isArray(exp.persona) ? exp.persona[0] : exp.persona;
    return p ? `${p.nombre} ${p.apellido_paterno} ${p.apellido_materno ?? ""}` : "—";
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dictamen médico</h1>
        <p className="text-muted-foreground">{jornada.nombre}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendientes de dictamen ({pendientes.length})</CardTitle>
          <CardDescription>Expedientes con captura completa, listos para revisión.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Capturado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendientes.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="font-medium">{nombrePersona(exp)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(exp.creado_en).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" nativeButton={false} render={<Link href={`/dictamen/${exp.id}`} />}>
                      Dictaminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pendientes.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">No hay expedientes pendientes.</p>
          )}
        </CardContent>
      </Card>

      {enCaptura.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {enCaptura.length} expediente(s) todavía en captura, no listos para dictamen.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ya dictaminados ({dictaminados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Folio</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {dictaminados.map((exp) => {
                const dictamen = Array.isArray(exp.dictamen_etapa1) ? exp.dictamen_etapa1[0] : exp.dictamen_etapa1;
                const folioActivo = (Array.isArray(exp.folio) ? exp.folio : [exp.folio]).find((f) => f?.activo);
                const info = dictamen ? ETIQUETA_RESULTADO[dictamen.resultado] : null;
                return (
                  <TableRow key={exp.id}>
                    <TableCell className="font-medium">{nombrePersona(exp)}</TableCell>
                    <TableCell>{info ? <Badge variant={info.variante}>{info.texto}</Badge> : "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{folioActivo?.folio_texto ?? "—"}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/dictamen/${exp.id}`} />}>
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {dictaminados.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">Todavía no hay dictámenes en esta jornada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
