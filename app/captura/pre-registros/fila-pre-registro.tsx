"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { descartarPreRegistro } from "@/app/captura/acciones";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";

/**
 * Forma de `pre_registro.datos` tal como la escribe `crearPreRegistro()`.
 * Todo es opcional a propósito: la columna es `jsonb` libre y nada en la
 * base garantiza estas llaves. Una fila vieja, o una guardada por una
 * versión anterior del formulario, no debe romper la bandeja.
 */
export interface DatosPreRegistroGuardados {
  nombre_paciente?: string | null;
  fecha_nacimiento?: string | null;
  nombre_contacto?: string | null;
  telefono?: string | null;
  servicio_deseado?: string | null;
  municipio?: string | null;
  comentarios?: string | null;
}

const ETIQUETA_SERVICIO: Record<string, string> = {
  cirugia: "Cirugía",
  laser: "Láser",
  no_se: "No sabe",
};

export function FilaPreRegistro({
  id,
  datos,
  creadoEn,
}: {
  id: string;
  datos: DatosPreRegistroGuardados;
  creadoEn: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enProceso, iniciarTransicion] = useTransition();

  function descartar() {
    setError(null);
    iniciarTransicion(async () => {
      const r = await descartarPreRegistro(id);
      if (r.error) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  const servicio = datos.servicio_deseado ?? "";

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{datos.nombre_paciente || "—"}</p>
        {datos.fecha_nacimiento ? (
          <p className="text-xs text-muted-foreground">Nace {datos.fecha_nacimiento}</p>
        ) : null}
        {datos.comentarios ? (
          <p className="mt-1 text-xs text-muted-foreground">{datos.comentarios}</p>
        ) : null}
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </TableCell>
      <TableCell>
        <p>{datos.nombre_contacto || "—"}</p>
        <p className="text-xs text-muted-foreground">
          {datos.telefono || "sin teléfono"}
          {datos.municipio ? ` · ${datos.municipio}` : ""}
        </p>
      </TableCell>
      <TableCell>{ETIQUETA_SERVICIO[servicio] ?? servicio ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(creadoEn).toLocaleDateString("es-MX")}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={descartar}
            disabled={enProceso}
          >
            {enProceso ? "…" : "Descartar"}
          </Button>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={`/captura/nuevo?preRegistro=${id}`} />}
          >
            Promover
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
