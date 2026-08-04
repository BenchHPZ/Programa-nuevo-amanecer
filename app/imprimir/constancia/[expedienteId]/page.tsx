import { notFound } from "next/navigation";

import { etiquetaResultado, obtenerOpcionesDictamen } from "@/lib/dictamen";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { ResultadoDictamen } from "@/lib/supabase/tipos";
import { Logo } from "@/components/marca/logo";

import { BotonImprimir } from "../../boton-imprimir";

interface FilaExpediente {
  id: string;
  jornada_id: string;
  paciente: { nombre: string; apellido_paterno: string; apellido_materno: string | null } | null;
  jornada: { nombre: string; sede: string } | null;
  dictamen_etapa1: {
    resultado: ResultadoDictamen;
    observaciones: string | null;
    recomendacion: string | null;
    medico_id: string;
    fecha: string;
  } | null;
}

/** RF-143: constancia imprimible para quien no obtiene folio (no apto / regresar en 6 meses). */
export default async function PaginaImprimirConstancia({
  params,
}: {
  params: Promise<{ expedienteId: string }>;
}) {
  const { expedienteId } = await params;
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("expediente")
    .select(
      "id, jornada_id, paciente:paciente_id(nombre, apellido_paterno, apellido_materno), jornada:jornada_id(nombre, sede), dictamen_etapa1(resultado, observaciones, recomendacion, medico_id, fecha)",
    )
    .eq("id", expedienteId)
    .eq("activo", true)
    .maybeSingle();

  const fila = data as unknown as FilaExpediente | null;
  const dictamen = fila?.dictamen_etapa1;

  // La constancia es para quien NO se lleva folio — se consulta directo en
  // vez de asumir por resultado (con cirugía dividida por sede, un simple
  // `resultado === "apto_cirugia" || "apto_laser"` ya no cubriría todos los
  // resultados que sí asignan folio, y habría que acordarse de tocar esto
  // cada vez que el catálogo de dictamen gane una salida nueva).
  const { count: tieneFolio } = fila
    ? await supabase
        .from("folio")
        .select("id", { count: "exact", head: true })
        .eq("expediente_id", fila.id)
        .eq("activo", true)
    : { count: 0 };

  if (!fila || !fila.paciente || !dictamen || (tieneFolio ?? 0) > 0) {
    notFound();
  }

  const [{ data: medico }, opciones] = await Promise.all([
    supabase.from("usuario_perfil").select("nombre").eq("id", dictamen.medico_id).maybeSingle(),
    obtenerOpcionesDictamen(supabase, fila.jornada_id),
  ]);

  const nombreCompleto = `${fila.paciente.nombre} ${fila.paciente.apellido_paterno} ${fila.paciente.apellido_materno ?? ""}`.trim();

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex justify-end print:hidden">
        <BotonImprimir />
      </div>

      <style>{`@page { size: letter; margin: 1in; }`}</style>
      <div className="space-y-6 border p-8 print:border-0">
        <div className="flex flex-col items-center gap-2 text-center">
          {/* Monocromo negro: se imprime en láser B/N y se fotocopia (§6). */}
          <Logo variante="negro" ancho={180} />
          <h1 className="text-xl font-semibold">Programa Nuevo Amanecer, A.C.</h1>
          <p className="text-muted-foreground">{fila.jornada?.nombre} — {fila.jornada?.sede}</p>
          <p className="mt-2 font-medium">Constancia de primera revisión</p>
        </div>

        <div className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Paciente: </span>
            {nombreCompleto}
          </p>
          <p>
            <span className="text-muted-foreground">Resultado: </span>
            {etiquetaResultado(dictamen.resultado, opciones).texto}
          </p>
          {dictamen.observaciones && (
            <p>
              <span className="text-muted-foreground">Observaciones: </span>
              {dictamen.observaciones}
            </p>
          )}
          {dictamen.recomendacion && (
            <p>
              <span className="text-muted-foreground">Recomendación: </span>
              {dictamen.recomendacion}
            </p>
          )}
          <p className="pt-2 text-xs text-muted-foreground">
            {medico?.nombre ?? "médico ya no disponible"} —{" "}
            {new Date(dictamen.fecha).toLocaleDateString("es-MX", { dateStyle: "long" })}
          </p>
        </div>

        {dictamen.resultado === "regresar_6_meses" && (
          <p className="border-t pt-4 text-sm text-muted-foreground">
            Este documento no sustituye un folio. Preséntelo en la siguiente jornada del programa
            junto con esta constancia.
          </p>
        )}
      </div>
    </div>
  );
}
