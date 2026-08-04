import Link from "next/link";
import { notFound } from "next/navigation";

import { puedeEditarSeccion, puedeGestionarFotos } from "@/lib/permisos";
import { urlFirmadaPapeleria } from "@/lib/storage";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EstadoExpediente } from "@/lib/supabase/tipos";

import { FormularioSeccion } from "@/components/form-renderer/formulario-seccion";
import type { DatosSeccion, DefinicionCatalogo } from "@/components/form-renderer/tipos";
import { FotoPaciente, type FotoInfo } from "@/components/expediente/foto-paciente";

import { FormularioPersona } from "./formulario-persona";
import { Papeleria } from "./papeleria";
import { UltimaModificacion } from "./ultima-modificacion";

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
 * `persona` trae la fila completa (id, nombre_normalizado, activo,
 * creado_por…). Enviar eso tal cual a un UPDATE revienta porque
 * nombre_normalizado es una columna generada — Postgres rechaza que
 * aparezca en el payload. El formulario solo debe recibir los campos que
 * de verdad edita.
 */
function aDatosEditables(persona: {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  fecha_nacimiento: string;
  sexo: string;
  curp: string | null;
  telefono: string | null;
  telefono_alterno: string | null;
  correo: string | null;
  estado_geografico: string | null;
  municipio: string | null;
  localidad: string | null;
  direccion: string | null;
}) {
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    fecha_nacimiento,
    sexo,
    curp,
    telefono,
    telefono_alterno,
    correo,
    estado_geografico,
    municipio,
    localidad,
    direccion,
  } = persona;
  return {
    nombre,
    apellido_paterno,
    apellido_materno,
    fecha_nacimiento,
    sexo,
    curp,
    telefono,
    telefono_alterno,
    correo,
    estado_geografico,
    municipio,
    localidad,
    direccion,
  };
}

export default async function PaginaExpediente({
  params,
}: {
  params: Promise<{ expedienteId: string }>;
}) {
  const { expedienteId } = await params;
  const supabase = await crearClienteServidor();

  const { data: expediente } = await supabase
    .from("expediente")
    .select("id, estado, paciente_id, jornada_id, jornada:jornada_id(nombre), paciente:paciente_id(*)")
    .eq("id", expedienteId)
    .eq("activo", true)
    .maybeSingle();

  if (!expediente || !expediente.paciente) notFound();

  const [{ data: vinculos }, { data: catalogos }, { data: seccionesGuardadas }, { data: consentimientos }, { data: documentos }, { data: fotos }] =
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
      supabase.from("expediente_seccion").select("seccion, datos").eq("expediente_id", expediente.id),
      supabase
        .from("consentimiento")
        .select("tipo, archivo_path, firmado_en")
        .eq("expediente_id", expediente.id),
      supabase
        .from("documento")
        .select("id, tipo, archivo_path, creado_en")
        .eq("expediente_id", expediente.id)
        .neq("tipo", "foto_paciente")
        .order("creado_en", { ascending: false }),
      supabase
        .from("documento")
        .select("id, archivo_path, vista_foto")
        .eq("expediente_id", expediente.id)
        .eq("tipo", "foto_paciente")
        .eq("activo", true)
        .order("creado_en", { ascending: false }),
    ]);

  const principal = vinculos?.[0];
  const jornada = Array.isArray(expediente.jornada) ? expediente.jornada[0] : expediente.jornada;

  const [
    consentimientosConUrl,
    documentosConUrl,
    fotosConUrlYNulos,
    puedeEliminarFotos,
    puedeAntecedentes,
    puedeSocioeconomico,
  ] = await Promise.all([
    Promise.all(
      (consentimientos ?? [])
        .filter((c) => c.tipo !== "consentimiento_informado")
        .map(async (c) => ({
          tipo: c.tipo as "aviso_privacidad" | "deslinde" | "uso_imagen",
          firmado_en: c.firmado_en,
          url: await urlFirmadaPapeleria(c.archivo_path),
        })),
    ),
    Promise.all(
      (documentos ?? []).map(async (d) => ({
        id: d.id,
        tipo: d.tipo as Exclude<(typeof d)["tipo"], "foto_paciente">,
        creado_en: d.creado_en,
        url: await urlFirmadaPapeleria(d.archivo_path),
      })),
    ),
    Promise.all(
      (fotos ?? []).map(async (f) => ({
        id: f.id,
        vista: f.vista_foto,
        url: await urlFirmadaPapeleria(f.archivo_path),
      })),
    ),
    puedeGestionarFotos(supabase),
    puedeEditarSeccion(supabase, "antecedentes"),
    puedeEditarSeccion(supabase, "socioeconomico"),
  ]);
  const fotosPaciente: FotoInfo[] = fotosConUrlYNulos.filter(
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
          <CardTitle>Datos del paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <FormularioPersona personaId={expediente.paciente.id} inicial={aDatosEditables(expediente.paciente)} />
          <div className="mt-3">
            <UltimaModificacion tabla="persona" registroId={expediente.paciente.id} />
          </div>
        </CardContent>
      </Card>

      {principal?.responsable && (
        <Card>
          <CardHeader>
            <CardTitle>Adulto responsable ({principal.parentesco})</CardTitle>
          </CardHeader>
          <CardContent>
            <FormularioPersona personaId={principal.responsable.id} inicial={aDatosEditables(principal.responsable)} />
            <div className="mt-3">
              <UltimaModificacion tabla="persona" registroId={principal.responsable.id} />
            </div>
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
            editable={false}
            puedeEliminar={puedeEliminarFotos}
          />
        </CardContent>
      </Card>

      {(["antecedentes", "socioeconomico"] as const).map((seccion) => {
        const catalogo = catalogos?.find((c) => c.seccion === seccion);
        if (!catalogo) {
          return (
            <Card key={seccion}>
              <CardHeader>
                <CardTitle>{TITULO_SECCION[seccion]}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sin catálogo configurado para esta jornada. Un administrativo debe cargarlo en
                  /admin/catalogo.
                </p>
              </CardContent>
            </Card>
          );
        }
        const definicion = catalogo.definicion as unknown as DefinicionCatalogo;
        const guardado = seccionesGuardadas?.find((s) => s.seccion === seccion);
        return (
          <Card key={seccion}>
            <CardHeader>
              <CardTitle>{TITULO_SECCION[seccion]}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormularioSeccion
                expedienteId={expediente.id}
                seccion={seccion}
                definicion={definicion}
                datosIniciales={(guardado?.datos as unknown as DatosSeccion) ?? {}}
                soloLectura={!(seccion === "antecedentes" ? puedeAntecedentes : puedeSocioeconomico)}
              />
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle>Papelería</CardTitle>
        </CardHeader>
        <CardContent>
          <Papeleria
            expedienteId={expediente.id}
            consentimientos={consentimientosConUrl}
            documentos={documentosConUrl}
          />
        </CardContent>
      </Card>

      {vinculos && vinculos.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Otros responsables registrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {vinculos.slice(1).map((v) =>
              v.responsable ? (
                <p key={v.responsable.id} className="text-sm text-muted-foreground">
                  {v.responsable.nombre} {v.responsable.apellido_paterno} — {v.parentesco}
                </p>
              ) : null,
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <UltimaModificacion tabla="expediente" registroId={expediente.id} />
      </div>
    </div>
  );
}
