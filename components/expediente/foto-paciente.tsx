"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Camera, FileUp, Trash2 } from "lucide-react";

import { desactivarFotoPaciente, subirFotoPaciente } from "@/app/dictamen/acciones";
import { comprimirImagen } from "@/lib/comprimir-imagen";
import type { VistaFoto } from "@/lib/supabase/tipos";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const MAX_FOTOS_POR_VISTA = 3;

const VISTAS: { clave: VistaFoto; etiqueta: string }[] = [
  { clave: "anterior", etiqueta: "Vista anterior" },
  { clave: "lateral_derecha", etiqueta: "Vista lateral derecha" },
  { clave: "lateral_izquierda", etiqueta: "Vista lateral izquierda" },
];

export interface FotoInfo {
  id: string;
  vista: VistaFoto;
  url: string;
}

/**
 * Compartido entre /dictamen (médico, puede subir) y /captura (capturista y
 * administrativo, solo la ven) — mismo componente, la prop `editable`
 * decide si aparecen los controles de carga. `puedeEliminar` (medico_triage
 * o administrativo) decide si aparece el botón de eliminar dentro de la
 * vista ampliada — se calcula del lado del servidor con
 * lib/permisos.ts:puedeGestionarFotos, RLS es quien de verdad lo exige.
 *
 * Se organizan en 3 vistas fijas (anterior, lateral derecha, lateral
 * izquierda), máximo 3 fotos por vista — cada subida es una fila nueva de
 * `documento` (nunca se borra nada), "eliminar" solo desactiva la fila
 * (activo = false).
 */
export function FotoPaciente({
  expedienteId,
  fotos,
  editable,
  puedeEliminar,
}: {
  expedienteId: string;
  fotos: FotoInfo[];
  editable: boolean;
  puedeEliminar: boolean;
}) {
  const [seleccionada, setSeleccionada] = useState<FotoInfo | null>(null);

  return (
    <div className="space-y-5">
      {VISTAS.map((vista) => (
        <SeccionVista
          key={vista.clave}
          expedienteId={expedienteId}
          vista={vista.clave}
          etiqueta={vista.etiqueta}
          fotos={fotos.filter((f) => f.vista === vista.clave)}
          editable={editable}
          onSeleccionar={setSeleccionada}
        />
      ))}

      <Dialog open={seleccionada !== null} onOpenChange={(abierto) => !abierto && setSeleccionada(null)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle className="text-sm font-medium text-muted-foreground">
            {seleccionada ? VISTAS.find((v) => v.clave === seleccionada.vista)?.etiqueta : ""}
          </DialogTitle>
          {seleccionada && (
            <VistaAmpliada
              foto={seleccionada}
              puedeEliminar={puedeEliminar}
              onEliminado={() => setSeleccionada(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SeccionVista({
  expedienteId,
  vista,
  etiqueta,
  fotos,
  editable,
  onSeleccionar,
}: {
  expedienteId: string;
  vista: VistaFoto;
  etiqueta: string;
  fotos: FotoInfo[];
  editable: boolean;
  onSeleccionar: (foto: FotoInfo) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enProceso, iniciarTransicion] = useTransition();
  const inputCamaraRef = useRef<HTMLInputElement>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  const llena = fotos.length >= MAX_FOTOS_POR_VISTA;

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
          formData.set("vista", vista);
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
        if (inputCamaraRef.current) inputCamaraRef.current.value = "";
        if (inputArchivoRef.current) inputArchivoRef.current.value = "";
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {etiqueta}{" "}
        <span className="text-xs font-normal text-muted-foreground">
          ({fotos.length}/{MAX_FOTOS_POR_VISTA})
        </span>
      </p>

      {fotos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((foto) => (
            // Vista previa real de una URL firmada de Storage, que expira —
            // no es un activo estático que next/image deba optimizar ni cachear.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={foto.id}
              src={foto.url}
              alt={etiqueta}
              onClick={() => onSeleccionar(foto)}
              className="h-24 w-full cursor-pointer rounded-md border object-cover transition-opacity hover:opacity-80"
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Sin fotos.</p>
      )}

      {editable && !llena && (
        <div className="flex items-center gap-2">
          <input
            ref={inputCamaraRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={alSeleccionarArchivos}
            disabled={enProceso}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="sm:hidden"
            disabled={enProceso}
            onClick={() => inputCamaraRef.current?.click()}
          >
            <Camera /> Tomar foto
          </Button>

          <input
            ref={inputArchivoRef}
            type="file"
            accept="image/*"
            multiple
            onChange={alSeleccionarArchivos}
            disabled={enProceso}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            disabled={enProceso}
            onClick={() => inputArchivoRef.current?.click()}
          >
            <FileUp /> Elegir archivo
          </Button>

          {enProceso && <span className="text-xs text-muted-foreground">Subiendo…</span>}
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function VistaAmpliada({
  foto,
  puedeEliminar,
  onEliminado,
}: {
  foto: FotoInfo;
  puedeEliminar: boolean;
  onEliminado: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enProceso, iniciarTransicion] = useTransition();

  function eliminar() {
    setError(null);
    iniciarTransicion(async () => {
      const r = await desactivarFotoPaciente(foto.id);
      if (r.error) {
        setError(r.error);
        return;
      }
      router.refresh();
      onEliminado();
    });
  }

  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={foto.url} alt="Foto del paciente" className="max-h-[70vh] w-full rounded-md object-contain" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {puedeEliminar && (
        <Button variant="destructive" size="sm" onClick={eliminar} disabled={enProceso}>
          <Trash2 /> {enProceso ? "Eliminando…" : "Eliminar foto"}
        </Button>
      )}
    </div>
  );
}
