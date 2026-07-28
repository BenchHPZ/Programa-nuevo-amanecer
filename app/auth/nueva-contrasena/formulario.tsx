"use client";

import { useActionState } from "react";

import { establecerNuevaContrasena } from "@/app/auth/acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EstadoAccion = { error?: string } | undefined;

export function FormularioNuevaContrasena() {
  const [estado, accion, enProceso] = useActionState<EstadoAccion, FormData>(
    establecerNuevaContrasena,
    undefined,
  );

  return (
    <form action={accion} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña nueva</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {estado?.error ? <p className="text-sm text-destructive">{estado.error}</p> : null}
      <Button type="submit" className="w-full" disabled={enProceso}>
        {enProceso ? "Guardando…" : "Guardar y entrar"}
      </Button>
    </form>
  );
}
