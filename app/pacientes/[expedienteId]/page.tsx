import Link from "next/link";
import { notFound } from "next/navigation";

import { generarQrSvg } from "@/lib/qr";
import { etiquetaResultado, obtenerOpcionesDictamen } from "@/lib/dictamen";
import { urlFirmadaPapeleria } from "@/lib/storage";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormularioSeccion } from "@/components/form-renderer/formulario-seccion";
import { type DatosSeccion, type DefinicionCatalogo, todosLosCampos, seccionCompleta } from "@/components/form-renderer/tipos";
import { FotoPaciente, type FotoInfo } from "@/components/expediente/foto-paciente";
import type { EstadoExpediente, Tables } from "@/lib/supabase/tipos";

const TITULO_SECCION = {
  antecedentes: "Historia clínica",
  socioeconomico: "Datos socioeconómicos",
} as const;

const ETIQUETA_ESTADO: Record<EstadoExpediente, string> = {
  borrador: "Borrador",
  completo: "Completo",
  dictaminado: "Dictaminado",
};

/**
 * El select combina varias relaciones embebidas a la vez; postgrest-js deja
 * de inferir el tipo de la fila en ese caso y cae en `any` sin avisar en el
 * propio `.select()`. Se tipa explícito, igual que en captura/dictamen.
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

/**
 * `/pacientes/[id]` — vista de solo consulta, accesible a los cuatro roles.
 * Ningún control editable: ni datos personales, ni las secciones del
 * catálogo, ni carga/borrado de fotos. Comunica estado de captura, folio y
 * QR con su impresión.
 */
export default async function PaginaVistaPaciente({
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

  const [{ data: vinculos }, { data: catalogos }, { data: seccionesGuardadas }, { data: fotos }, opciones] =
    await Promise.all([
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
      supabase.from("expediente_seccion").select("seccion, datos, completa").eq("expediente_id", expediente.id),
      supabase
        .from("documento")
        .select("id, archivo_path, vista_foto")
        .eq("expediente_id", expediente.id)
        .eq("tipo", "foto_paciente")
        .eq("activo", true)
        .order("creado_en", { ascending: false }),
      obtenerOpcionesDictamen(supabase, expediente.jornada_id),
    ]);

  const jornada = Array.isArray(expediente.jornada) ? expediente.jornada[0] : expediente.jornada;
  const principal = vinculos?.[0];
  const dictamen = Array.isArray(expediente.dictamen_etapa1) ? expediente.dictamen_etapa1[0] : expediente.dictamen_etapa1;
  const folioActivo = (Array.isArray(expediente.folio) ? expediente.folio : [expediente.folio]).find((f) => f?.activo);
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
        <div className="flex items-center gap-3">
          <Badge>{ETIQUETA_ESTADO[expediente.estado]}</Badge>
          <Button variant="outline" nativeButton={false} render={<Link href="/pacientes" />}>
            Volver a pacientes
          </Button>
        </div>
      </div>

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
            <span className="text-muted-foreground">CURP: </span>
            {expediente.paciente.curp ?? "—"}
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
          <FotoPaciente expedienteId={expediente.id} fotos={fotosPaciente} editable={false} puedeEliminar={false} />
        </CardContent>
      </Card>

      {(["antecedentes", "socioeconomico"] as const).map((seccion) => {
        const catalogo = catalogos?.find((c) => c.seccion === seccion);
        const guardado = seccionesGuardadas?.find((s) => s.seccion === seccion);
        if (!catalogo) {
          return (
            <Card key={seccion}>
              <CardHeader>
                <CardTitle>{TITULO_SECCION[seccion]}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Sin catálogo configurado para esta jornada.</p>
              </CardContent>
            </Card>
          );
        }
        const definicion = catalogo.definicion as unknown as DefinicionCatalogo;
        const datos = (guardado?.datos as unknown as DatosSeccion) ?? {};
        const completa = seccionCompleta(todosLosCampos(definicion), datos);
        return (
          <Card key={seccion}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{TITULO_SECCION[seccion]}</CardTitle>
                <Badge variant={completa ? "default" : "secondary"}>
                  {completa ? "Completa" : "Faltan campos"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <FormularioSeccion
                expedienteId={expediente.id}
                seccion={seccion}
                definicion={definicion}
                datosIniciales={datos}
                soloLectura
                motivoSoloLectura="esta pantalla es de solo consulta"
              />
            </CardContent>
          </Card>
        );
      })}

      {dictamen && (
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
            {!folioActivo && (
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/imprimir/constancia/${expediente.id}`} />}>
                Imprimir constancia
              </Button>
            )}
          </CardContent>
        </Card>
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
