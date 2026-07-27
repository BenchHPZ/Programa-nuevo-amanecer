"use client";

import { useActionState } from "react";
import Link from "next/link";

import { iniciarSesion } from "@/app/auth/acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EstadoAccion = { error?: string } | undefined;

export function FormularioInicioSesion({ siguiente }: { siguiente: string }) {
  const [estado, accion, enProceso] = useActionState<EstadoAccion, FormData>(
    iniciarSesion,
    undefined,
  );

  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="siguiente" value={siguiente} />
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {estado?.error ? <p className="text-sm text-destructive">{estado.error}</p> : null}
      <Button type="submit" className="w-full" disabled={enProceso}>
        {enProceso ? "Entrando…" : "Iniciar sesión"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/auth/registro" className="underline underline-offset-4">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
