import { obtenerJornadaActiva } from "@/lib/jornada";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { EditorCatalogo } from "./editor";

export const dynamic = "force-dynamic";

const SECCIONES = [
  { clave: "antecedentes" as const, titulo: "Antecedentes médicos" },
  { clave: "socioeconomico" as const, titulo: "Estudio socioeconómico" },
];

const PLANTILLA_VACIA = JSON.stringify({ campos: [] }, null, 2);

export default async function PaginaCatalogo() {
  const jornada = await obtenerJornadaActiva();

  if (!jornada) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>No hay jornada activa</CardTitle>
            <CardDescription>
              Activa una jornada en Etapa 1 desde /admin/jornadas antes de configurar su catálogo.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const supabase = await crearClienteServidor();
  const { data: catalogos } = await supabase
    .from("catalogo_campos")
    .select("seccion, definicion, version")
    .eq("jornada_id", jornada.id)
    .eq("vigente", true);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Catálogo de campos</h1>
        <p className="text-muted-foreground">{jornada.nombre}</p>
        <p className="mt-2 text-sm text-amber-700">
          Catálogo base propuesto por el equipo técnico, pendiente de validación por la
          asociación (docs/PLAN.md). Editar aquí lo actualiza de inmediato en /captura, sin
          desplegar código (RF-131).
        </p>
      </div>

      {SECCIONES.map(({ clave, titulo }) => {
        const catalogo = catalogos?.find((c) => c.seccion === clave);
        return (
          <EditorCatalogo
            key={clave}
            jornadaId={jornada.id}
            seccion={clave}
            titulo={titulo}
            version={catalogo?.version ?? null}
            definicionInicial={catalogo ? JSON.stringify(catalogo.definicion, null, 2) : PLANTILLA_VACIA}
          />
        );
      })}
    </div>
  );
}
