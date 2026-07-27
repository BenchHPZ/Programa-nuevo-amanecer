"use client";

import { useTransition } from "react";

import { cambiarEstadoJornada } from "./acciones";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import type { EstadoJornada } from "@/lib/supabase/tipos";

const ETIQUETA_ESTADO: Record<EstadoJornada, string> = {
  planeada: "Planeada",
  etapa1: "Etapa 1 — en curso",
  etapa2: "Etapa 2 — en curso",
  cerrada: "Cerrada",
};

interface Props {
  jornada: {
    id: string;
    clave: string;
    nombre: string;
    sede: string;
    fecha_inicio_etapa1: string;
    fecha_fin_etapa1: string;
    estado: EstadoJornada;
  };
}

export function FilaJornada({ jornada }: Props) {
  const [enProceso, iniciarTransicion] = useTransition();

  function cambiar(estado: EstadoJornada) {
    iniciarTransicion(async () => {
      await cambiarEstadoJornada(jornada.id, estado);
    });
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{jornada.clave}</TableCell>
      <TableCell className="font-medium">{jornada.nombre}</TableCell>
      <TableCell className="text-muted-foreground">{jornada.sede}</TableCell>
      <TableCell className="text-muted-foreground">
        {jornada.fecha_inicio_etapa1} — {jornada.fecha_fin_etapa1}
      </TableCell>
      <TableCell>
        <Select value={jornada.estado} onValueChange={(v) => cambiar(v as EstadoJornada)} disabled={enProceso}>
          <SelectTrigger className="w-48">
            <SelectValue>
              <Badge variant={jornada.estado === "etapa1" ? "default" : "secondary"}>
                {ETIQUETA_ESTADO[jornada.estado]}
              </Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ETIQUETA_ESTADO) as EstadoJornada[]).map((estado) => (
              <SelectItem key={estado} value={estado}>
                {ETIQUETA_ESTADO[estado]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}
