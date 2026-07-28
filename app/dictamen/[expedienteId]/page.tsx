import Link from "next/link";
import { notFound } from "next/navigation";

import { generarQrSvg } from "@/lib/qr";
import { urlFirmadaPapeleria } from "@/lib/storage";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormularioSeccion } from "@/components/form-renderer/formulario-seccion";
import type { DatosSeccion, DefinicionCatalogo } from "@/components/form-renderer/tipos";
import { FotoPaciente } from "@/components/expediente/foto-paciente";
import type { EstadoExpediente, ResultadoDictamen, Tables } from "@/lib/supabase/tipos";

import { FormularioDictamen } from "./formulario-dictamen";

const TITULO_SECCION = {
  antecedentes: "Historia clínica",
  socioeconomico: "Datos socioeconómicos",
} as const;

const ETIQUETA_RESULTADO: Record<ResultadoDictamen, { texto: string; variante: "default" | "secondary" | "destructive" }> = {
  apto_cirugia: { texto: "Apto — cirugía", variante: "default" },
  apto_laser: { texto: "Apto — láser", variante: "default" },
  no_apto: { texto: "No apto", variante: "destructive" },
  regresar_6_meses: { texto: "Regresar en 6 meses", variante: "secondary" },
};

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

  const [{ data: vinculos }, { data: catalogos }, { data: seccionesGuardadas }, { data: fotos }] = await Promise.all([
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
      .select("archivo_path")
      .eq("expediente_id", expediente.id)
      .eq("tipo", "foto_paciente")
      .order("creado_en", { ascending: false }),
  ]);

  const jornada = Array.isArray(expediente.jornada) ? expediente.jornada[0] : expediente.jornada;
  const principal = vinculos?.[0];
  const dictamen = Array.isArray(expediente.dictamen_etapa1) ? expediente.dictamen_etapa1[0] : expediente.dictamen_etapa1;
  const folioActivo = (Array.isArray(expediente.folio) ? expediente.folio : [expediente.folio]).find((f) => f?.activo);
  const { data: medico } = dictamen
    ? await supabase.from("usuario_perfil").select("nombre").eq("id", dictamen.medico_id).maybeSingle()
    : { data: null };
  const qrSvg = folioActivo ? await generarQrSvg(folioActivo.folio_texto) : null;
  const urlsFotoPaciente = (
    await Promise.all((fotos ?? []).map((f) => urlFirmadaPapeleria(f.archivo_path)))
  ).filter((url): url is string => url !== null);

  const catalogoAntecedentes = catalogos?.find((c) => c.seccion === "antecedentes");
  const definicionAntecedentes = catalogoAntecedentes?.definicion as unknown as DefinicionCatalogo | undefined;
  const seccionAntecedentes = seccionesGuardadas?.find((s) => s.seccion === "antecedentes");

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
        <Button variant="outline" nativeButton={false} render={<Link href="/dictamen" />}>
          Volver al listado
        </Button>
      </div>

      {expediente.estado === "borrador" && (
        <Card>
          <CardHeader>
            <CardTitle>Expediente incompleto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Todavía faltan secciones por capturar. No está listo para dictamen.
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
          <FotoPaciente expedienteId={expediente.id} urls={urlsFotoPaciente} editable />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{TITULO_SECCION.antecedentes}</CardTitle>
        </CardHeader>
        <CardContent>
          {definicionAntecedentes ? (
            <FormularioSeccion
              expedienteId={expediente.id}
              seccion="antecedentes"
              campos={definicionAntecedentes.campos}
              datosIniciales={(seccionAntecedentes?.datos as unknown as DatosSeccion) ?? {}}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin catálogo configurado para esta jornada. Un administrativo debe cargarlo en
              /admin/catalogo.
            </p>
          )}
        </CardContent>
      </Card>

      {dictamen ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Dictamen
              <Badge variant={ETIQUETA_RESULTADO[dictamen.resultado].variante}>
                {ETIQUETA_RESULTADO[dictamen.resultado].texto}
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
            {!folioActivo && (
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/imprimir/constancia/${expediente.id}`} />}>
                Imprimir constancia
              </Button>
            )}
          </CardContent>
        </Card>
      ) : expediente.estado === "completo" ? (
        <FormularioDictamen expedienteId={expediente.id} />
      ) : null}

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
