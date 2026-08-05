import Link from "next/link";
import { notFound } from "next/navigation";

import { generarQrSvg } from "@/lib/qr";
import { etiquetaResultado, obtenerOpcionesDictamen } from "@/lib/dictamen";
import { puedeGestionarFotos, rolActual } from "@/lib/permisos";
import { urlFirmadaPapeleria } from "@/lib/storage";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FormularioSeccion } from "@/components/form-renderer/formulario-seccion";
import type { DatosSeccion, DefinicionCatalogo } from "@/components/form-renderer/tipos";
import { FotoPaciente, type FotoInfo } from "@/components/expediente/foto-paciente";
import type { EstadoExpediente, Tables } from "@/lib/supabase/tipos";

import { FormularioDictamen } from "./formulario-dictamen";
import { ModificarDictamen } from "./modificar-dictamen";

const TITULO_SECCION = {
  antecedentes: "Historia clínica",
  socioeconomico: "Datos socioeconómicos",
} as const;

/**
 * El select combina cuatro relaciones embebidas a la vez; postgrest-js deja
 * de inferir el tipo de la fila en ese caso y cae en `any` sin avisar en el
 * propio `.select()`. Se tipa explícito aquí, igual que ya se hace con las
 * columnas JSONB en otras páginas.
 */
interface FilaExpediente {
  id: string;
  estado: EstadoExpediente;
  paciente_id: string;
  jornada_id: string;
  jornada: { nombre: string } | { nombre: string }[] | null;
  paciente: Tables<"persona"> | null;
  dictamen_etapa1: Tables<"dictamen_etapa1"> | Tables<"dictamen_etapa1">[] | null;
  folio: Tables<"folio"> | Tables<"folio">[] | null;
}

export default async function PaginaDictamenExpediente({
  params,
}: {
  params: Promise<{ expedienteId: string }>;
}) {
  const { expedienteId } = await params;
  const supabase = await crearClienteServidor();

  const { data: fila } = await supabase
    .from("expediente")
    .select(
      "id, estado, paciente_id, jornada_id, jornada:jornada_id(nombre), paciente:paciente_id(*), dictamen_etapa1(*), folio(*)",
    )
    .eq("id", expedienteId)
    .eq("activo", true)
    .maybeSingle();

  const expediente = fila as unknown as FilaExpediente | null;

  if (!expediente || !expediente.paciente) notFound();

  const rol = await rolActual(supabase);
  if (rol !== "medico_triage" && rol !== "administrativo") notFound();

  const [
    { data: vinculos },
    { data: catalogos },
    { data: seccionesGuardadas },
    { data: fotos },
    puedeEliminarFotos,
    opciones,
  ] = await Promise.all([
      supabase
        .from("paciente_responsable")
        .select("parentesco, es_principal, responsable:responsable_id(*)")
        .eq("paciente_id", expediente.paciente_id)
        .order("es_principal", { ascending: false }),
      supabase
        .from("catalogo_campos")
        .select("seccion, definicion")
        .eq("jornada_id", expediente.jornada_id)
        .eq("vigente", true),
      supabase.from("expediente_seccion").select("seccion, datos").eq("expediente_id", expediente.id),
      supabase
        .from("documento")
        .select("id, archivo_path, vista_foto")
        .eq("expediente_id", expediente.id)
        .eq("tipo", "foto_paciente")
        .eq("activo", true)
        .order("creado_en", { ascending: false }),
      puedeGestionarFotos(supabase),
      obtenerOpcionesDictamen(supabase, expediente.jornada_id),
    ]);

  const jornada = Array.isArray(expediente.jornada) ? expediente.jornada[0] : expediente.jornada;
  const principal = vinculos?.[0];
  const dictamen = Array.isArray(expediente.dictamen_etapa1) ? expediente.dictamen_etapa1[0] : expediente.dictamen_etapa1;
  const folioActivo = (Array.isArray(expediente.folio) ? expediente.folio : [expediente.folio]).find((f) => f?.activo);
  const { data: medico } = dictamen
    ? await supabase.from("usuario_perfil").select("nombre").eq("id", dictamen.medico_id).maybeSingle()
    : { data: null };
  const { data: modificador } = dictamen?.modificado_por
    ? await supabase.from("usuario_perfil").select("nombre").eq("id", dictamen.modificado_por).maybeSingle()
    : { data: null };
  const qrSvg = folioActivo ? await generarQrSvg(folioActivo.folio_texto) : null;
  const fotosPacienteConNulos = await Promise.all(
    (fotos ?? []).map(async (f) => ({
      id: f.id,
      vista: f.vista_foto,
      url: await urlFirmadaPapeleria(f.archivo_path),
    })),
  );
  const fotosPaciente: FotoInfo[] = fotosPacienteConNulos.filter(
    (f): f is FotoInfo => f.url !== null && f.vista !== null,
  );

  const catalogoAntecedentes = catalogos?.find((c) => c.seccion === "antecedentes");
  const definicionAntecedentes = catalogoAntecedentes?.definicion as unknown as DefinicionCatalogo | undefined;
  const seccionAntecedentes = seccionesGuardadas?.find((s) => s.seccion === "antecedentes");

  const catalogoSocioeconomico = catalogos?.find((c) => c.seccion === "socioeconomico");
  const definicionSocioeconomico = catalogoSocioeconomico?.definicion as unknown as DefinicionCatalogo | undefined;
  const seccionSocioeconomico = seccionesGuardadas?.find((s) => s.seccion === "socioeconomico");

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {expediente.paciente.nombre} {expediente.paciente.apellido_paterno}{" "}
            {expediente.paciente.apellido_materno ?? ""}
          </h1>
          <p className="text-muted-foreground">{jornada?.nombre}</p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/pacientes" />}>
          Volver a pacientes
        </Button>
      </div>

      {expediente.estado === "borrador" && (
        <Card>
          <CardHeader>
            <CardTitle>Captura en progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Historia clínica o Datos socioeconómicos todavía no están completos. Puedes
              registrar el dictamen de todas formas.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Fecha de nacimiento: </span>
            {new Date(expediente.paciente.fecha_nacimiento).toLocaleDateString("es-MX")}
          </p>
          <p>
            <span className="text-muted-foreground">Sexo: </span>
            {expediente.paciente.sexo === "H" ? "Masculino" : "Femenino"}
          </p>
          <p>
            <span className="text-muted-foreground">Teléfono: </span>
            {expediente.paciente.telefono ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Municipio: </span>
            {expediente.paciente.municipio ?? "—"}
          </p>
        </CardContent>
      </Card>

      {principal?.responsable && (
        <Card>
          <CardHeader>
            <CardTitle>Adulto responsable ({principal.parentesco})</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Nombre: </span>
              {principal.responsable.nombre} {principal.responsable.apellido_paterno}{" "}
              {principal.responsable.apellido_materno ?? ""}
            </p>
            <p>
              <span className="text-muted-foreground">Teléfono: </span>
              {principal.responsable.telefono ?? "—"}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Foto del paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <FotoPaciente
            expedienteId={expediente.id}
            fotos={fotosPaciente}
            editable
            puedeEliminar={puedeEliminarFotos}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y pt-6">
          {(
            [
              ["antecedentes", definicionAntecedentes, seccionAntecedentes],
              ["socioeconomico", definicionSocioeconomico, seccionSocioeconomico],
            ] as const
          ).map(([seccion, definicion, guardado]) => (
            <Collapsible key={seccion} className="py-2 first:pt-0 last:pb-0">
              <CollapsibleTrigger>{TITULO_SECCION[seccion]}</CollapsibleTrigger>
              <CollapsibleContent>
                {definicion ? (
                  <FormularioSeccion
                    expedienteId={expediente.id}
                    seccion={seccion}
                    definicion={definicion}
                    datosIniciales={(guardado?.datos as unknown as DatosSeccion) ?? {}}
                    soloLectura
                    motivoSoloLectura="aquí solo se consulta — se edita desde /captura"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin catálogo configurado para esta jornada. Un administrativo debe cargarlo en
                    /admin/catalogo.
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      {dictamen ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Dictamen
              <Badge variant={etiquetaResultado(dictamen.resultado, opciones).variante}>
                {etiquetaResultado(dictamen.resultado, opciones).texto}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
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
            <p className="text-xs text-muted-foreground">
              {medico?.nombre ?? "médico ya no disponible"} —{" "}
              {new Date(dictamen.fecha).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
            </p>
            {dictamen.modificado_por && dictamen.modificado_en && (
              <p className="text-xs text-muted-foreground">
                Modificado por {modificador?.nombre ?? "usuario ya no disponible"} —{" "}
                {new Date(dictamen.modificado_en).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {!folioActivo && (
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/imprimir/constancia/${expediente.id}`} />}>
                  Imprimir constancia
                </Button>
              )}
            </div>
            <ModificarDictamen
              expedienteId={expediente.id}
              opciones={opciones}
              valorInicial={{
                resultado: dictamen.resultado,
                observaciones: dictamen.observaciones ?? "",
                recomendacion: dictamen.recomendacion ?? "",
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <FormularioDictamen expedienteId={expediente.id} opciones={opciones} />
      )}

      {folioActivo && qrSvg && (
        <Card>
          <CardHeader>
            <CardTitle>Folio</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <p className="font-mono text-lg">{folioActivo.folio_texto}</p>
            <div className="h-56 w-56" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <Button size="sm" nativeButton={false} render={<Link href={`/imprimir/folio/${folioActivo.id}`} />}>
              Imprimir folio
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
