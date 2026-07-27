import { notFound } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";
import { Logo } from "@/components/marca/logo";

import { BotonImprimir } from "../../../boton-imprimir";
import { AvisoPrivacidad, Deslinde, UsoImagen } from "../../contenido";

const PLANTILLAS = {
  aviso_privacidad: { titulo: "Aviso de privacidad", Componente: AvisoPrivacidad },
  deslinde: { titulo: "Deslinde de responsabilidad", Componente: Deslinde },
  uso_imagen: { titulo: "Uso de imagen", Componente: UsoImagen },
} as const;

type TipoValido = keyof typeof PLANTILLAS;

function esTipoValido(tipo: string): tipo is TipoValido {
  return tipo in PLANTILLAS;
}

interface FilaExpediente {
  id: string;
  paciente_id: string;
  paciente: { nombre: string; apellido_paterno: string; apellido_materno: string | null } | null;
  jornada: { nombre: string; sede: string } | null;
}

export default async function PaginaImprimirConsentimiento({
  params,
}: {
  params: Promise<{ tipo: string; expedienteId: string }>;
}) {
  const { tipo, expedienteId } = await params;
  if (!esTipoValido(tipo)) notFound();

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("expediente")
    .select(
      "id, paciente_id, paciente:paciente_id(nombre, apellido_paterno, apellido_materno), jornada:jornada_id(nombre, sede)",
    )
    .eq("id", expedienteId)
    .eq("activo", true)
    .maybeSingle();

  const fila = data as unknown as FilaExpediente | null;
  if (!fila || !fila.paciente) notFound();

  const { data: vinculos } = await supabase
    .from("paciente_responsable")
    .select("parentesco, responsable:responsable_id(nombre, apellido_paterno, apellido_materno)")
    .eq("paciente_id", fila.paciente_id)
    .order("es_principal", { ascending: false })
    .limit(1);

  const principal = vinculos?.[0];
  const responsable = principal?.responsable;
  const nombreResponsable = responsable
    ? `${responsable.nombre} ${responsable.apellido_paterno} ${responsable.apellido_materno ?? ""}`.trim()
    : "—";
  const nombrePaciente = `${fila.paciente.nombre} ${fila.paciente.apellido_paterno} ${fila.paciente.apellido_materno ?? ""}`.trim();

  const { Componente, titulo } = PLANTILLAS[tipo];

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm font-medium text-amber-700">
          Borrador — pendiente de revisión legal. No usar en operación real (docs/CUMPLIMIENTO.md).
        </p>
        <BotonImprimir />
      </div>

      <style>{`@page { size: letter; margin: 1in; }`}</style>
      <div className="space-y-4 border p-8 print:border-0">
        <p className="border border-dashed border-amber-600 bg-amber-50 p-2 text-center text-xs font-medium text-amber-800">
          BORRADOR — PENDIENTE DE REVISIÓN LEGAL — {titulo}
        </p>
        {/*
          Encabezado con logo y nombre legal completo (§6). Monocromo negro:
          es un documento que se firma de forma autógrafa, se fotocopia y se
          archiva.
        */}
        <div className="flex flex-col items-center gap-1 pb-2 text-center">
          <Logo variante="negro" ancho={180} />
          <p className="text-sm font-semibold">Programa Nuevo Amanecer, A.C.</p>
        </div>
        <Componente
          nombrePaciente={nombrePaciente}
          nombreResponsable={nombreResponsable}
          parentesco={principal?.parentesco ?? "—"}
          jornadaNombre={fila.jornada?.nombre ?? ""}
          jornadaSede={fila.jornada?.sede ?? ""}
          fecha={new Date().toLocaleDateString("es-MX", { dateStyle: "long" })}
        />
      </div>
    </div>
  );
}
