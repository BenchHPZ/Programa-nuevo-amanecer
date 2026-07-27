"use client";

import { useActionState } from "react";
import Link from "next/link";

import { registrarUsuario } from "@/app/auth/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EstadoAccion = { error?: string; exito?: string } | undefined;

export default function PaginaRegistro() {
  const [estado, accion, enProceso] = useActionState<EstadoAccion, FormData>(
    registrarUsuario,
    undefined,
  );

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>
            Tu cuenta quedará <strong>pendiente de aprobación</strong>. Un administrativo te
            asignará un rol antes de que puedas ver cualquier dato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {estado?.exito ? (
            <p className="text-sm text-green-700">{estado.exito}</p>
          ) : (
            <form action={accion} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input id="nombre" name="nombre" required autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
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
                {enProceso ? "Creando cuenta…" : "Crear cuenta"}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/iniciar-sesion" className="underline underline-offset-4">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
