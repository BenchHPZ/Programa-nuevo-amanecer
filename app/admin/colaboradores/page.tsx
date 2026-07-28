import Link from "next/link";

import { crearClienteServidor } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
  ETIQUETA_ESTADO,
  ETIQUETA_TIPO,
  FilaColaborador,
  type DatosColaboradorGuardados,
} from "./fila-colaborador";

export const dynamic = "force-dynamic";

const TIPOS = ["medico", "enfermeria_estudiante", "apoyo_general", "donativo"];
const ESTADOS = ["nuevo", "contactado", "aceptado", "descartado"];

const CLASES_SELECT =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

interface FilaCruda {
  id: string;
  tipo: string;
  estado: string;
  datos: DatosColaboradorGuardados;
  creado_en: string;
  usuario_id: string | null;
}

export default async function PaginaColaboradores({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const uno = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const tipo = TIPOS.includes(uno("tipo") ?? "") ? uno("tipo") : undefined;
  const estado = ESTADOS.includes(uno("estado") ?? "") ? uno("estado") : undefined;

  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("registro_colaborador")
    .select("id, tipo, estado, datos, creado_en, usuario_id")
    .order("creado_en", { ascending: false });

  if (tipo) consulta = consulta.eq("tipo", tipo as never);
  if (estado) consulta = consulta.eq("estado", estado as never);

  const { data, error } = await consulta;
  const filas = (data ?? []) as unknown as FilaCruda[];
  const nuevos = filas.filter((f) => f.estado === "nuevo").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Colaboradores</h1>
          <p className="text-muted-foreground">
            Quien se ofreció a apoyar desde la página pública.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin" />}>
          Volver al panel
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form method="get" className="grid items-end gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="f-tipo">Perfil</Label>
              <select id="f-tipo" name="tipo" defaultValue={tipo ?? ""} className={CLASES_SELECT}>
                <option value="">Todos</option>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {ETIQUETA_TIPO[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="f-estado">Estado</Label>
              <select id="f-estado" name="estado" defaultValue={estado ?? ""} className={CLASES_SELECT}>
                <option value="">Todos</option>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {ETIQUETA_ESTADO[e]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Filtrar</Button>
              <Button variant="outline" nativeButton={false} render={<Link href="/admin/colaboradores" />}>
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filas.length} registro{filas.length === 1 ? "" : "s"}
          </CardTitle>
          <CardDescription>
            {nuevos > 0
              ? `${nuevos} sin revisar. Conviene contactarlos antes de la jornada.`
              : "Nada pendiente de revisar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="py-8 text-center text-destructive">No se pudo cargar: {error.message}</p>
          ) : filas.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Todavía no hay registros con estos filtros.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Persona</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Recibido</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((f) => (
                  <FilaColaborador
                    key={f.id}
                    id={f.id}
                    tipo={f.tipo}
                    estado={f.estado}
                    datos={f.datos}
                    creadoEn={f.creado_en}
                    usuarioId={f.usuario_id}
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
