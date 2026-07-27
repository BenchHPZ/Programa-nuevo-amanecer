import Link from "next/link";

import { obtenerJornadaActiva } from "@/lib/jornada";
import { separarNombre } from "@/lib/nombres";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { AsistenteNuevoExpediente, type ValoresIniciales } from "./asistente";

interface DatosPreRegistro {
  nombre_paciente?: string | null;
  fecha_nacimiento?: string | null;
  nombre_contacto?: string | null;
  telefono?: string | null;
}

/**
 * Cuando se llega desde la bandeja (`?preRegistro=…`), se preparan los
 * valores para prellenar la búsqueda. Se prellena la **búsqueda**, no el
 * alta: el primer paso sigue siendo buscar duplicados (RF-110), que es
 * justo lo que un pre-registro no puede saber.
 */
async function cargarPreRegistro(id: string): Promise<ValoresIniciales | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("pre_registro")
    .select("datos")
    .eq("id", id)
    .eq("estado", "nuevo")
    .maybeSingle();

  if (!data) return null;

  const datos = data.datos as DatosPreRegistro;
  const paciente = separarNombre(datos.nombre_paciente ?? "");
  const responsable = separarNombre(datos.nombre_contacto ?? "");

  return {
    paciente: {
      nombre: paciente.nombre,
      apellidoPaterno: paciente.apellidoPaterno,
      apellidoMaterno: paciente.apellidoMaterno,
      fechaNacimiento: datos.fecha_nacimiento ?? "",
      telefono: datos.telefono ?? "",
    },
    responsable: {
      nombre: responsable.nombre,
      apellidoPaterno: responsable.apellidoPaterno,
      apellidoMaterno: responsable.apellidoMaterno,
      fechaNacimiento: "",
      telefono: datos.telefono ?? "",
    },
  };
}

export default async function PaginaNuevoExpediente({
  searchParams,
}: {
  searchParams: Promise<{ preRegistro?: string }>;
}) {
  const { preRegistro: preRegistroId } = await searchParams;
  const jornada = await obtenerJornadaActiva();

  if (!jornada) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>No hay jornada activa</CardTitle>
            <CardDescription>
              No se puede dar de alta un expediente sin una jornada en Etapa 1. Pide a un
              administrativo que la cree o la active.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const valoresIniciales = preRegistroId ? await cargarPreRegistro(preRegistroId) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nuevo expediente</h1>
          <p className="text-muted-foreground">{jornada.nombre}</p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/captura" />}>
          Volver al listado
        </Button>
      </div>

      {preRegistroId && !valoresIniciales ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Ese pre-registro ya no está pendiente: alguien más lo promovió o lo descartó.
              Puedes continuar dando de alta el expediente a mano.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {valoresIniciales ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Datos tomados del pre-registro. El nombre viene en un solo campo desde la página
              pública, así que la separación en apellidos es una <strong>suposición</strong> —
              confírmala con la familia antes de guardar.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <AsistenteNuevoExpediente
        jornadaId={jornada.id}
        preRegistroId={valoresIniciales ? preRegistroId : undefined}
        valoresIniciales={valoresIniciales}
      />
    </div>
  );
}
