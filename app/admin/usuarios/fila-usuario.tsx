"use client";

import { useState, useTransition } from "react";

import { aprobarUsuario, reactivarUsuario, suspenderUsuario } from "./acciones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import type { EstadoUsuario, RolUsuario } from "@/lib/supabase/tipos";

const ETIQUETA_ROL: Record<RolUsuario, string> = {
  capturista: "Capturista",
  informista: "Informista",
  administrativo: "Administrativo",
  medico_triage: "Médico de triage",
  primer_contacto: "Primer contacto (Etapa 2)",
  autorizador: "Autorizador (Etapa 2)",
  evaluador_prequirurgico: "Evaluador prequirúrgico (Etapa 2)",
  programador: "Programador (Etapa 2)",
};

const ETIQUETA_ESTADO: Record<EstadoUsuario, { texto: string; variante: "secondary" | "default" | "destructive" }> = {
  pendiente: { texto: "Pendiente", variante: "secondary" },
  activo: { texto: "Activo", variante: "default" },
  suspendido: { texto: "Suspendido", variante: "destructive" },
};

interface Props {
  usuario: {
    id: string;
    nombre: string;
    correo: string;
    rol: RolUsuario | null;
    estado: EstadoUsuario;
  };
}

export function FilaUsuario({ usuario }: Props) {
  const [rolSeleccionado, setRolSeleccionado] = useState<RolUsuario | "">(usuario.rol ?? "");
  const [enProceso, iniciarTransicion] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function manejar(promesa: Promise<{ error?: string; exito?: boolean }>) {
    setError(null);
    iniciarTransicion(async () => {
      const resultado = await promesa;
      if (resultado?.error) setError(resultado.error);
    });
  }

  const estadoInfo = ETIQUETA_ESTADO[usuario.estado];

  return (
    <TableRow>
      <TableCell className="font-medium">{usuario.nombre}</TableCell>
      <TableCell className="text-muted-foreground">{usuario.correo}</TableCell>
      <TableCell>
        <Badge variant={estadoInfo.variante}>{estadoInfo.texto}</Badge>
      </TableCell>
      <TableCell>{usuario.rol ? ETIQUETA_ROL[usuario.rol] : "—"}</TableCell>
      <TableCell className="flex flex-wrap items-center gap-2">
        {usuario.estado === "pendiente" && (
          <>
            <Select value={rolSeleccionado} onValueChange={(v) => setRolSeleccionado(v as RolUsuario)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Elegir rol…" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ETIQUETA_ROL) as RolUsuario[]).map((rol) => (
                  <SelectItem key={rol} value={rol}>
                    {ETIQUETA_ROL[rol]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!rolSeleccionado || enProceso}
              onClick={() => manejar(aprobarUsuario(usuario.id, rolSeleccionado as RolUsuario))}
            >
              Aprobar
            </Button>
          </>
        )}
        {usuario.estado === "activo" && (
          <Button
            size="sm"
            variant="destructive"
            disabled={enProceso}
            onClick={() => manejar(suspenderUsuario(usuario.id))}
          >
            Suspender
          </Button>
        )}
        {usuario.estado === "suspendido" && (
          <Button size="sm" variant="outline" disabled={enProceso} onClick={() => manejar(reactivarUsuario(usuario.id))}>
            Reactivar
          </Button>
        )}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </TableCell>
    </TableRow>
  );
}
