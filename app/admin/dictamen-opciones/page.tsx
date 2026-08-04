import { obtenerJornadaActiva } from "@/lib/jornada";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { EditorDictamenOpciones } from "./editor";

export const dynamic = "force-dynamic";

const PLANTILLA_VACIA = JSON.stringify({ opciones: [] }, null, 2);

export default async function PaginaDictamenOpciones() {
  const jornada = await obtenerJornadaActiva();

  if (!jornada) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>No hay jornada activa</CardTitle>
            <CardDescription>
              Activa una jornada en Etapa 1 desde /admin/jornadas antes de configurar sus
              salidas de dictamen.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const supabase = await crearClienteServidor();
  const { data: catalogo } = await supabase
    .from("catalogo_dictamen")
    .select("definicion, version")
    .eq("jornada_id", jornada.id)
    .eq("vigente", true)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Opciones de dictamen</h1>
        <p className="text-muted-foreground">{jornada.nombre}</p>
        <p className="mt-2 text-sm text-amber-700">
          Sin catálogo configurado, el médico ve las 4 salidas originales (apto para cirugía,
          apto para láser, no apto, regresar en 6 meses). Editar aquí lo actualiza de
          inmediato en /dictamen y en /pacientes, sin desplegar código.
        </p>
      </div>

      <EditorDictamenOpciones
        jornadaId={jornada.id}
        version={catalogo?.version ?? null}
        definicionInicial={catalogo ? JSON.stringify(catalogo.definicion, null, 2) : PLANTILLA_VACIA}
      />
    </div>
  );
}
