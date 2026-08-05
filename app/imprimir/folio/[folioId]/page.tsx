import Link from "next/link";
import { notFound } from "next/navigation";

import { generarQrSvg } from "@/lib/qr";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Logo } from "@/components/marca/logo";

import { BotonImprimir } from "../../boton-imprimir";

const ETIQUETA_SERVICIO = { cirugia: "Cirugía", laser: "Láser" } as const;
/** 'general' es la sede sentinela (sin división) — no se muestra. */
const ETIQUETA_SEDE_FOLIO: Record<string, string> = { gto: "Guanajuato", leon: "León" };

interface FilaFolio {
  folio_texto: string;
  servicio: keyof typeof ETIQUETA_SERVICIO;
  sede: string;
  digito_verificador: number;
  activo: boolean;
  expediente: {
    paciente: { nombre: string; apellido_paterno: string; apellido_materno: string | null } | null;
    jornada: { nombre: string; sede: string; fecha_etapa2: string | null } | null;
  } | null;
}

export default async function PaginaImprimirFolio({
  params,
  searchParams,
}: {
  params: Promise<{ folioId: string }>;
  searchParams: Promise<{ formato?: string }>;
}) {
  const { folioId } = await params;
  const { formato: formatoParam } = await searchParams;
  const formato = formatoParam === "carta" ? "carta" : "termico";

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("folio")
    .select(
      "folio_texto, servicio, sede, digito_verificador, activo, expediente:expediente_id(paciente:paciente_id(nombre, apellido_paterno, apellido_materno), jornada:jornada_id(nombre, sede, fecha_etapa2))",
    )
    .eq("id", folioId)
    .maybeSingle();

  const fila = data as unknown as FilaFolio | null;
  if (!fila || !fila.expediente?.paciente) notFound();

  const { paciente, jornada } = fila.expediente;
  const nombreCompleto = `${paciente!.nombre} ${paciente!.apellido_paterno} ${paciente!.apellido_materno ?? ""}`.trim();
  const etiquetaServicio = ETIQUETA_SERVICIO[fila.servicio]
    + (ETIQUETA_SEDE_FOLIO[fila.sede] ? ` — ${ETIQUETA_SEDE_FOLIO[fila.sede]}` : "");
  const fechaEtapa2 = jornada?.fecha_etapa2
    ? new Date(jornada.fecha_etapa2).toLocaleDateString("es-MX", { dateStyle: "long" })
    : "Por confirmar";

  if (!fila.activo) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6 text-center">
        <p className="text-2xl font-bold text-destructive">FOLIO ANULADO</p>
        <p className="font-mono text-lg line-through">{fila.folio_texto}</p>
        <p className="text-sm text-muted-foreground">
          Este folio ya no es válido — el dictamen de {nombreCompleto} fue modificado después de
          asignarlo. Consulta el expediente para ver el folio vigente, si aplica.
        </p>
      </div>
    );
  }

  const qrSvg = await generarQrSvg(fila.folio_texto);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex gap-2 text-sm">
          <Link
            href={`/imprimir/folio/${folioId}?formato=termico`}
            className={`rounded-md border px-3 py-1.5 ${formato === "termico" ? "border-primary bg-primary/10" : "border-input"}`}
          >
            Térmico (58 mm)
          </Link>
          <Link
            href={`/imprimir/folio/${folioId}?formato=carta`}
            className={`rounded-md border px-3 py-1.5 ${formato === "carta" ? "border-primary bg-primary/10" : "border-input"}`}
          >
            Hoja carta
          </Link>
        </div>
        <BotonImprimir />
      </div>

      {formato === "termico" ? (
        <>
          <style>{`@page { size: 58mm auto; margin: 3mm; }`}</style>
          <div className="mx-auto w-[54mm] space-y-2 border border-dashed p-2 text-center font-mono text-[11px] leading-tight print:border-0">
            <p className="font-semibold">Programa Nuevo Amanecer</p>
            <p>{jornada?.nombre}</p>
            <hr />
            <p className="text-sm font-bold">FOLIO</p>
            <p className="text-base font-bold tracking-wide">{fila.folio_texto}</p>
            <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <hr />
            <p>{nombreCompleto}</p>
            <p>Servicio: {etiquetaServicio}</p>
            <hr />
            <p>2ª revisión: {fechaEtapa2}</p>
            <p>{jornada?.sede}</p>
            <p>Verificador: {fila.digito_verificador}</p>
          </div>
        </>
      ) : (
        <>
          <style>{`@page { size: letter; margin: 1in; }`}</style>
          <div className="space-y-6 border p-8 print:border-0">
            {/*
              Monocromo negro: estos documentos se imprimen en láser B/N y se
              fotocopian (manual §6). En el formato térmico no va logo — 58 mm
              de papel y una impresora que no hace medios tonos; ahí el folio y
              su QR son lo único que importa.
            */}
            <div className="flex flex-col items-center gap-2 text-center">
              <Logo variante="negro" ancho={180} />
              <h1 className="text-xl font-semibold">Programa Nuevo Amanecer, A.C.</h1>
              <p className="text-muted-foreground">{jornada?.nombre} — {jornada?.sede}</p>
            </div>

            <div className="flex items-center justify-between gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Folio asignado</p>
                <p className="text-3xl font-bold tracking-wide">{fila.folio_texto}</p>
                <p className="text-sm text-muted-foreground">Dígito verificador: {fila.digito_verificador}</p>
              </div>
              <div className="h-40 w-40 shrink-0" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>

            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Paciente: </span>
                {nombreCompleto}
              </p>
              <p>
                <span className="text-muted-foreground">Servicio asignado: </span>
                {etiquetaServicio}
              </p>
              <p>
                <span className="text-muted-foreground">Fecha de la segunda revisión: </span>
                {fechaEtapa2}
              </p>
            </div>

            <div className="space-y-2 border-t pt-4 text-sm">
              <p className="font-medium">Instrucciones</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Este folio es su lugar en la segunda revisión. Sin él no podrán pasar.</li>
                <li>Preséntelo el día de la cita, junto con la documentación pendiente.</li>
                <li>Si el código QR no puede leerse, el folio puede escribirse a mano con su dígito verificador.</li>
                <li>Si lo pierden, puede reponerse con el nombre y CURP del paciente.</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
