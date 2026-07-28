import Link from "next/link";

import { cerrarSesion } from "@/app/auth/acciones";
import { obtenerJornadaActiva } from "@/lib/jornada";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function Conteo({
  etiqueta,
  valor,
  resaltado,
  href,
}: {
  etiqueta: string;
  valor: number;
  resaltado?: boolean;
  href?: string;
}) {
  const contenido = (
    <div className="rounded-md border p-3 transition-colors hover:bg-muted/50">
      <p className={`text-2xl font-semibold tabular-nums ${resaltado ? "" : "text-muted-foreground"}`}>
        {valor}
      </p>
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
    </div>
  );
  return href ? <Link href={href}>{contenido}</Link> : contenido;
}

export default async function PaginaAdmin() {
  const hoy = new Date().toISOString().slice(0, 10);
  const jornada = await obtenerJornadaActiva();

  let conteos: {
    expedientes: number | null;
    borradores: number | null;
    completos: number | null;
    dictaminados: number | null;
    apto_cirugia: number | null;
    apto_laser: number | null;
    no_apto: number | null;
    regresar_6_meses: number | null;
    expedientes_hoy: number | null;
    dictaminados_hoy: number | null;
  } | null = null;

  if (jornada) {
    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("vista_conteos_jornada")
      .select(
        "expedientes, borradores, completos, dictaminados, apto_cirugia, apto_laser, no_apto, regresar_6_meses, expedientes_hoy, dictaminados_hoy",
      )
      .eq("jornada_id", jornada.id)
      .maybeSingle();
    conteos = data;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panel administrativo</h1>
          <p className="text-muted-foreground">
            {jornada ? jornada.nombre : "Sin jornada activa"}
          </p>
        </div>
        <form action={cerrarSesion}>
          <Button variant="outline" type="submit">
            Cerrar sesión
          </Button>
        </form>
      </div>

      {jornada && (
        <Card>
          <CardHeader>
            <CardTitle>Conteos de la jornada</CardTitle>
            <CardDescription>
              <Link href={`/admin/expedientes?desde=${hoy}&hasta=${hoy}`} className="underline underline-offset-2">
                {conteos?.expedientes_hoy ?? 0} expediente{(conteos?.expedientes_hoy ?? 0) === 1 ? "" : "s"}
              </Link>{" "}
              y{" "}
              <Link
                href={`/admin/expedientes?dictaminadoDesde=${hoy}&dictaminadoHasta=${hoy}`}
                className="underline underline-offset-2"
              >
                {conteos?.dictaminados_hoy ?? 0} dictamen{(conteos?.dictaminados_hoy ?? 0) === 1 ? "" : "es"}
              </Link>{" "}
              capturados hoy.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Conteo etiqueta="Expedientes" valor={conteos?.expedientes ?? 0} resaltado href="/admin/expedientes" />
            <Conteo
              etiqueta="En borrador"
              valor={conteos?.borradores ?? 0}
              href="/admin/expedientes?estado=borrador"
            />
            <Conteo
              etiqueta="Completos, sin dictamen"
              valor={conteos?.completos ?? 0}
              href="/admin/expedientes?estado=completo"
            />
            <Conteo
              etiqueta="Dictaminados"
              valor={conteos?.dictaminados ?? 0}
              resaltado
              href="/admin/expedientes?estado=dictaminado"
            />
            <Conteo
              etiqueta="Aptos para cirugía"
              valor={conteos?.apto_cirugia ?? 0}
              resaltado
              href="/admin/expedientes?dictamen=apto_cirugia"
            />
            <Conteo
              etiqueta="Aptos para láser"
              valor={conteos?.apto_laser ?? 0}
              resaltado
              href="/admin/expedientes?dictamen=apto_laser"
            />
            <Conteo etiqueta="No aptos" valor={conteos?.no_apto ?? 0} href="/admin/expedientes?dictamen=no_apto" />
            <Conteo
              etiqueta="Regresar en 6 meses"
              valor={conteos?.regresar_6_meses ?? 0}
              href="/admin/expedientes?dictamen=regresar_6_meses"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/expedientes">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Expedientes</CardTitle>
              <CardDescription>Listado con filtros y exportación del padrón a CSV.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/importar">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Importar de contingencia</CardTitle>
              <CardDescription>Cargar lo capturado en papel, revisando antes de guardar.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/colaboradores">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Colaboradores</CardTitle>
              <CardDescription>Quien se ofreció a apoyar desde la página pública.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/usuarios">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>Aprobar cuentas, asignar rol, suspender acceso.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/jornadas">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Jornadas</CardTitle>
              <CardDescription>Crear jornadas y activar la que está en Etapa 1.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/catalogo">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Catálogo de campos</CardTitle>
              <CardDescription>Historia clínica y datos socioeconómicos, sin desplegar.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
