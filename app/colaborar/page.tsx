import Link from "next/link";

import { ORGANIZACION } from "@/config/contenido-landing";
import { obtenerJornadaParaConvocatoria } from "@/lib/jornada";
import { Logo } from "@/components/marca/logo";

import { FormularioColaborador } from "./formulario";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quiero colaborar — Programa Nuevo Amanecer",
  description:
    "Personal médico, enfermería, estudiantes, apoyo general y donativos para las jornadas de labio y paladar hendido.",
};

export default async function PaginaColaborar() {
  const jornada = await obtenerJornadaParaConvocatoria();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b px-6 py-4">
        <Link href="/" aria-label="Inicio">
          <Logo ancho={180} prioridad />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-6 px-6 py-12">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Quiero colaborar</h1>
          <p className="text-muted-foreground">
            Cada jornada la sostienen cerca de treinta especialistas voluntarios, además de
            enfermería, estudiantes y gente que ayuda con la logística. Nadie cobra honorarios.
          </p>
          {jornada ? (
            <p className="text-muted-foreground">
              La próxima jornada es <strong>{jornada.nombre}</strong>, en {jornada.sede}.
            </p>
          ) : null}
        </div>

        <FormularioColaborador />

        <p className="text-sm text-muted-foreground">
          Este registro no crea una cuenta en el sistema ni confirma su participación: es una
          forma de que {ORGANIZACION.nombreCorto} sepa que usted quiere ayudar y pueda
          contactarle.
        </p>
      </main>
    </div>
  );
}
