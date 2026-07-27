"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { subirConsentimiento, subirDocumento } from "@/app/captura/acciones";
import { Badge } from "@/components/ui/badge";
import { comprimirImagen } from "@/lib/comprimir-imagen";
import type { TipoConsentimiento, TipoDocumento } from "@/lib/supabase/tipos";

const ETIQUETA_CONSENTIMIENTO: Record<Exclude<TipoConsentimiento, "consentimiento_informado">, string> = {
  aviso_privacidad: "Aviso de privacidad",
  deslinde: "Deslinde de responsabilidad",
  uso_imagen: "Uso de imagen",
};

const TIPOS_CONSENTIMIENTO = Object.keys(ETIQUETA_CONSENTIMIENTO) as (keyof typeof ETIQUETA_CONSENTIMIENTO)[];

const ETIQUETA_DOCUMENTO: Record<TipoDocumento, string> = {
  acta: "Acta de nacimiento",
  curp: "CURP",
  ine_responsable: "INE del responsable",
  comprobante_domicilio: "Comprobante de domicilio",
  estudio_previo: "Estudio previo",
};

interface ConsentimientoInfo {
  tipo: keyof typeof ETIQUETA_CONSENTIMIENTO;
  firmado_en: string | null;
  url: string | null;
}

interface DocumentoInfo {
  id: string;
  tipo: TipoDocumento;
  creado_en: string;
  url: string | null;
}

async function archivoComprimido(archivo: File): Promise<File> {
  const blob = await comprimirImagen(archivo);
  return new File([blob], "papeleria.jpg", { type: "image/jpeg" });
}

function FilaConsentimiento({
  expedienteId,
  tipo,
  info,
}: {
  expedienteId: string;
  tipo: keyof typeof ETIQUETA_CONSENTIMIENTO;
  info: ConsentimientoInfo | undefined;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enProceso, iniciarTransicion] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function alSeleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError(null);
    iniciarTransicion(async () => {
      try {
        const comprimido = await archivoComprimido(archivo);
        const formData = new FormData();
        formData.set("expedienteId", expedienteId);
        formData.set("tipo", tipo);
        formData.set("archivo", comprimido);
        const r = await subirConsentimiento(formData);
        if (r.error) {
          setError(r.error);
          return;
        }
        router.refresh();
      } catch {
        setError("No se pudo comprimir la imagen.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b py-2 text-sm last:border-0">
      <Badge variant={info ? "default" : "secondary"} className="w-24 justify-center">
        {info ? "Firmado" : "Pendiente"}
      </Badge>
      <span className="flex-1">{ETIQUETA_CONSENTIMIENTO[tipo]}</span>
      <a
        className="text-xs text-primary underline"
        href={`/imprimir/consentimiento/${tipo}/${expedienteId}`}
        target="_blank"
        rel="noreferrer"
      >
        Imprimir
      </a>
      {info?.url && (
        <a className="text-xs text-primary underline" href={info.url} target="_blank" rel="noreferrer">
          Ver escaneo
        </a>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={alSeleccionarArchivo}
        disabled={enProceso}
        className="text-xs"
      />
      {enProceso && <span className="text-xs text-muted-foreground">Subiendo…</span>}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

function SubidaDocumento({ expedienteId }: { expedienteId: string }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoDocumento>("curp");
  const [error, setError] = useState<string | null>(null);
  const [enProceso, iniciarTransicion] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function alSeleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError(null);
    iniciarTransicion(async () => {
      try {
        const comprimido = await archivoComprimido(archivo);
        const formData = new FormData();
        formData.set("expedienteId", expedienteId);
        formData.set("tipo", tipo);
        formData.set("archivo", comprimido);
        const r = await subirDocumento(formData);
        if (r.error) {
          setError(r.error);
          return;
        }
        router.refresh();
      } catch {
        setError("No se pudo comprimir la imagen.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoDocumento)}
        className="rounded-md border border-input bg-background px-2 py-1 text-sm"
      >
        {Object.entries(ETIQUETA_DOCUMENTO).map(([valor, etiqueta]) => (
          <option key={valor} value={valor}>
            {etiqueta}
          </option>
        ))}
      </select>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={alSeleccionarArchivo}
        disabled={enProceso}
        className="text-xs"
      />
      {enProceso && <span className="text-xs text-muted-foreground">Subiendo…</span>}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

export function Papeleria({
  expedienteId,
  consentimientos,
  documentos,
}: {
  expedienteId: string;
  consentimientos: ConsentimientoInfo[];
  documentos: DocumentoInfo[];
}) {
  const firmados = TIPOS_CONSENTIMIENTO.filter((t) => consentimientos.some((c) => c.tipo === t)).length;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-sm font-medium">
          Consentimientos: {firmados}/{TIPOS_CONSENTIMIENTO.length} firmados
        </p>
        {TIPOS_CONSENTIMIENTO.map((tipo) => (
          <FilaConsentimiento
            key={tipo}
            expedienteId={expedienteId}
            tipo={tipo}
            info={consentimientos.find((c) => c.tipo === tipo)}
          />
        ))}
      </div>

      <div className="space-y-2 border-t pt-3">
        <p className="text-sm font-medium">Documentos de soporte</p>
        {documentos.length > 0 && (
          <ul className="space-y-1 text-sm">
            {documentos.map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <span>{ETIQUETA_DOCUMENTO[d.tipo]}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(d.creado_en).toLocaleDateString("es-MX")}
                </span>
                {d.url && (
                  <a className="text-xs text-primary underline" href={d.url} target="_blank" rel="noreferrer">
                    Ver
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        <SubidaDocumento expedienteId={expedienteId} />
      </div>
    </div>
  );
}
