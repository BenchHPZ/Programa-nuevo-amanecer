"use client";

import { useActionState } from "react";

import { crearJornada } from "./acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EstadoAccion = { error?: string; exito?: boolean } | undefined;

export function FormularioNuevaJornada() {
  const [estado, accion, enProceso] = useActionState<EstadoAccion, FormData>(crearJornada, undefined);

  return (
    <form action={accion} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="clave">Clave</Label>
        <Input id="clave" name="clave" placeholder="2026A" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" placeholder="Jornada Guanajuato 2026" required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="sede">Sede</Label>
        <Input id="sede" name="sede" placeholder="Hospital..., Guanajuato" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fecha_inicio_etapa1">Inicio primera revisión</Label>
        <Input id="fecha_inicio_etapa1" name="fecha_inicio_etapa1" type="date" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fecha_fin_etapa1">Fin primera revisión</Label>
        <Input id="fecha_fin_etapa1" name="fecha_fin_etapa1" type="date" required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="fecha_etapa2">Fecha segunda revisión (si ya se sabe)</Label>
        <Input id="fecha_etapa2" name="fecha_etapa2" type="date" />
      </div>
      <input type="hidden" name="estado" value="planeada" />
      {estado?.error ? <p className="text-sm text-destructive sm:col-span-2">{estado.error}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={enProceso}>
          {enProceso ? "Creando…" : "Crear jornada"}
        </Button>
      </div>
    </form>
  );
}
