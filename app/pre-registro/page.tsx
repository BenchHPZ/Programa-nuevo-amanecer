import Link from "next/link";

import { obtenerJornadaParaConvocatoria } from "@/lib/jornada";
import { Button } from "@/components/ui/button";

import { FormularioPreRegistro } from "./formulario";

export const dynamic = "force-dynamic";

export default async function PaginaPreRegistro() {
  const jornada = await obtenerJornadaParaConvocatoria();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pre-registro</h1>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Volver al inicio
        </Button>
      </div>

      {jornada ? (
        <p className="text-muted-foreground">
          Te estás pre-registrando para <strong>{jornada.nombre}</strong>, en {jornada.sede}, del{" "}
          {new Date(jornada.fecha_inicio_etapa1).toLocaleDateString("es-MX", { dateStyle: "long" })}{" "}
          al {new Date(jornada.fecha_fin_etapa1).toLocaleDateString("es-MX", { dateStyle: "long" })}.
        </p>
      ) : (
        <p className="text-muted-foreground">
          Por el momento no hay una jornada anunciada. Puedes dejar tus datos y te contactaremos
          en cuanto se confirme la próxima fecha.
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Este formulario no reserva tu lugar de forma automática: un miembro del equipo revisará
        tu información y se pondrá en contacto contigo. También puedes presentarte directamente en
        la sede el día de la jornada.
      </p>

      <FormularioPreRegistro />
    </div>
  );
}
