"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { subirFotoPaciente } from "@/app/dictamen/acciones";
import { comprimirImagen } from "@/lib/comprimir-imagen";

/**
 * Compartido entre /dictamen (médico, puede subir) y /captura (capturista y
 * administrativo, solo la ven) — mismo componente, la prop `editable`
 * decide si aparece el input de cámara/archivo.
 *
 * Se piden varias fotos por paciente (mínimo 3, no forzado por el sistema):
 * cada subida es una fila nueva de `documento` (nunca se borra nada), así
 * que aquí se muestran todas, no solo la última.
 */
export function FotoPaciente({
  expedienteId,
  urls,
  editable,
}: {
  expedienteId: string;
  urls: string[];
  editable: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enProceso, iniciarTransicion] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function alSeleccionarArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    if (archivos.length === 0) return;
    setError(null);
    iniciarTransicion(async () => {
      try {
        for (const archivo of archivos) {
          const blob = await comprimirImagen(archivo);
          const comprimido = new File([blob], "foto-paciente.jpg", { type: "image/jpeg" });
          const formData = new FormData();
          formData.set("expedienteId", expedienteId);
          formData.set("archivo", comprimido);
          const r = await subirFotoPaciente(formData);
          if (r.error) {
            setError(r.error);
            return;
          }
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
    <div className="space-y-3">
      {urls.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {urls.map((url) => (
            // Vista previa real de una URL firmada de Storage, que expira —
            // no es un activo estático que next/image deba optimizar ni cachear.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt="Foto del paciente"
              className="h-32 w-full rounded-md border object-cover"
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {editable
            ? "Aún no se ha tomado una foto del paciente."
            : "El médico todavía no ha subido una foto del paciente."}
        </p>
      )}
      {editable && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={alSeleccionarArchivos}
            disabled={enProceso}
            className="text-xs"
          />
          {enProceso && <span className="text-xs text-muted-foreground">Subiendo…</span>}
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      )}
    </div>
  );
}
