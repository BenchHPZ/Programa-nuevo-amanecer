"use client";

import { useState, useTransition } from "react";

import {
  aprobarUsuario,
  cambiarRolUsuario,
  generarEnlaceRestablecimiento,
  reactivarUsuario,
  suspenderUsuario,
} from "./acciones";
import { EnlaceGenerado } from "@/components/admin/enlace-generado";
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

export const ETIQUETA_ROL: Record<RolUsuario, string> = {
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

/**
 * `<SelectValue />` sin hijos ni `items` en `<Select>` muestra el value
 * crudo ("capturista") en el disparador cerrado, no la etiqueta — mismo bug
 * de base-ui/react/select ya encontrado y resuelto para "Sexo" en
 * formulario-persona.tsx. Mismo workaround: pasarle la etiqueta como
 * función hija.
 */
function etiquetaRol(valor: unknown): string {
  return (typeof valor === "string" && ETIQUETA_ROL[valor as RolUsuario]) || "Elegir rol…";
}

function SelectorRol({
  value,
  onChange,
  id,
}: {
  value: RolUsuario | "";
  onChange: (rol: RolUsuario) => void;
  id?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as RolUsuario)}>
      <SelectTrigger id={id} className="w-56">
        <SelectValue>{etiquetaRol}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(ETIQUETA_ROL) as RolUsuario[]).map((rol) => (
          <SelectItem key={rol} value={rol}>
            {ETIQUETA_ROL[rol]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface Props {
  usuario: {
    id: string;
    nombre: string;
    correo: string;
    rol: RolUsuario | null;
    estado: EstadoUsuario;
  };
  usuarioActualId: string;
}

export function FilaUsuario({ usuario, usuarioActualId }: Props) {
  const [rolSeleccionado, setRolSeleccionado] = useState<RolUsuario | "">(usuario.rol ?? "");
  const [enProceso, iniciarTransicion] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [enlace, setEnlace] = useState<string | null>(null);

  const esUnoMismo = usuario.id === usuarioActualId;

  function manejar(promesa: Promise<{ error?: string; exito?: boolean }>) {
    setError(null);
    iniciarTransicion(async () => {
      const resultado = await promesa;
      if (resultado?.error) setError(resultado.error);
    });
  }

  function generarEnlace() {
    setError(null);
    setEnlace(null);
    iniciarTransicion(async () => {
      const r = await generarEnlaceRestablecimiento(usuario.correo);
      if (r.error) {
        setError(r.error);
        return;
      }
      if (r.enlace) setEnlace(r.enlace);
    });
  }

  const estadoInfo = ETIQUETA_ESTADO[usuario.estado];

  return (
    <TableRow>
      <TableCell className="font-medium align-top">{usuario.nombre}</TableCell>
      <TableCell className="text-muted-foreground align-top">{usuario.correo}</TableCell>
      <TableCell className="align-top">
        <Badge variant={estadoInfo.variante}>{estadoInfo.texto}</Badge>
      </TableCell>
      <TableCell className="align-top">{usuario.rol ? ETIQUETA_ROL[usuario.rol] : "—"}</TableCell>
      <TableCell className="align-top">
        <div className="flex flex-wrap items-center gap-2">
          {usuario.estado === "pendiente" && (
            <>
              <SelectorRol value={rolSeleccionado} onChange={setRolSeleccionado} />
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
            <>
              {esUnoMismo ? (
                <span className="text-xs text-muted-foreground">Esta es tu propia cuenta</span>
              ) : (
                <>
                  <SelectorRol value={rolSeleccionado} onChange={setRolSeleccionado} />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!rolSeleccionado || rolSeleccionado === usuario.rol || enProceso}
                    onClick={() => manejar(cambiarRolUsuario(usuario.id, rolSeleccionado as RolUsuario))}
                  >
                    Cambiar rol
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={enProceso}
                    onClick={() => manejar(suspenderUsuario(usuario.id))}
                  >
                    Suspender
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" disabled={enProceso} onClick={generarEnlace}>
                Generar enlace
              </Button>
            </>
          )}
          {usuario.estado === "suspendido" && (
            <>
              <Button size="sm" variant="outline" disabled={enProceso} onClick={() => manejar(reactivarUsuario(usuario.id))}>
                Reactivar
              </Button>
              <Button size="sm" variant="outline" disabled={enProceso} onClick={generarEnlace}>
                Generar enlace
              </Button>
            </>
          )}
        </div>
        {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
        {enlace ? <EnlaceGenerado enlace={enlace} /> : null}
      </TableCell>
    </TableRow>
  );
}
