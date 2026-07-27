"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";

import { cambiarEstadoColaborador } from "./acciones";

/** Forma libre de `registro_colaborador.datos`: nada en la base la garantiza. */
export interface DatosColaboradorGuardados {
  nombre?: string | null;
  correo?: string | null;
  telefono?: string | null;
  ciudad?: string | null;
  comentarios?: string | null;
  especialidad?: string | null;
  institucion?: string | null;
  cedula_profesional?: string | null;
  anios_experiencia?: string | null;
  carrera?: string | null;
  semestre?: string | null;
  servicio_social?: boolean | null;
  area_interes?: string | null;
  disponibilidad?: string | null;
  organizacion?: string | null;
  tipo_apoyo?: string | null;
}

export const ETIQUETA_TIPO: Record<string, string> = {
  medico: "Personal médico",
  enfermeria_estudiante: "Enfermería / estudiante",
  apoyo_general: "Apoyo general",
  donativo: "Donativo",
};

export const ETIQUETA_ESTADO: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  aceptado: "Aceptado",
  descartado: "Descartado",
};

/** Detalle propio de cada perfil, para no mostrar campos vacíos de los otros. */
function detalle(tipo: string, d: DatosColaboradorGuardados): string[] {
  const partes: string[] = [];
  if (tipo === "medico") {
    if (d.especialidad) partes.push(d.especialidad);
    if (d.institucion) partes.push(d.institucion);
    if (d.cedula_profesional) partes.push(`céd. ${d.cedula_profesional}`);
    if (d.anios_experiencia) partes.push(`${d.anios_experiencia} años`);
  } else if (tipo === "enfermeria_estudiante") {
    if (d.carrera) partes.push(d.carrera);
    if (d.institucion) partes.push(d.institucion);
    if (d.semestre) partes.push(`sem. ${d.semestre}`);
    if (d.servicio_social) partes.push("servicio social");
  } else if (tipo === "apoyo_general") {
    if (d.area_interes) partes.push(d.area_interes);
    if (d.disponibilidad) partes.push(d.disponibilidad);
  } else if (tipo === "donativo") {
    if (d.organizacion) partes.push(d.organizacion);
    if (d.tipo_apoyo) partes.push(d.tipo_apoyo);
  }
  return partes;
}

export function FilaColaborador({
  id,
  tipo,
  estado,
  datos,
  creadoEn,
}: {
  id: string;
  tipo: string;
  estado: string;
  datos: DatosColaboradorGuardados;
  creadoEn: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enProceso, iniciarTransicion] = useTransition();

  function cambiar(nuevo: string) {
    setError(null);
    iniciarTransicion(async () => {
      const r = await cambiarEstadoColaborador(id, nuevo);
      if (r.error) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  const partes = detalle(tipo, datos);

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{datos.nombre || "—"}</p>
        {partes.length > 0 ? (
          <p className="text-xs text-muted-foreground">{partes.join(" · ")}</p>
        ) : null}
        {datos.comentarios ? (
          <p className="mt-1 text-xs text-muted-foreground">{datos.comentarios}</p>
        ) : null}
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{ETIQUETA_TIPO[tipo] ?? tipo}</Badge>
      </TableCell>
      <TableCell className="text-sm">
        <p>{datos.correo || "—"}</p>
        <p className="text-xs text-muted-foreground">
          {datos.telefono || "sin teléfono"}
          {datos.ciudad ? ` · ${datos.ciudad}` : ""}
        </p>
      </TableCell>
      <TableCell>
        <Badge variant={estado === "nuevo" ? "default" : "secondary"}>
          {ETIQUETA_ESTADO[estado] ?? estado}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(creadoEn).toLocaleDateString("es-MX")}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap justify-end gap-1">
          {estado !== "contactado" && (
            <Button variant="outline" size="sm" onClick={() => cambiar("contactado")} disabled={enProceso}>
              Contactado
            </Button>
          )}
          {estado !== "aceptado" && (
            <Button size="sm" onClick={() => cambiar("aceptado")} disabled={enProceso}>
              Aceptar
            </Button>
          )}
          {estado !== "descartado" && (
            <Button variant="outline" size="sm" onClick={() => cambiar("descartado")} disabled={enProceso}>
              Descartar
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
