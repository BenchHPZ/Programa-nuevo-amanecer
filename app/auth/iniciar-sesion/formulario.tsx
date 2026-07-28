"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { iniciarSesion } from "@/app/auth/acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearClienteNavegador } from "@/lib/supabase/client";

type EstadoAccion = { error?: string } | undefined;

function IconoGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4 3.11C6.22 6.87 8.87 4.76 12 4.76Z"
      />
    </svg>
  );
}

function BotonGoogle() {
  const [error, setError] = useState<string | null>(null);
  const [enProceso, setEnProceso] = useState(false);

  async function conGoogle() {
    setError(null);
    setEnProceso(true);
    const supabase = crearClienteNavegador();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback/oauth` },
    });
    // Si signInWithOAuth resuelve con error, nunca llegó a redirigir — si
    // no hay error, el navegador ya está saliendo hacia Google.
    if (err) {
      setError("No se pudo iniciar el ingreso con Google. Intenta de nuevo.");
      setEnProceso(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full" disabled={enProceso} onClick={conGoogle}>
        <IconoGoogle />
        {enProceso ? "Redirigiendo…" : "Continuar con Google"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function FormularioInicioSesion({ siguiente }: { siguiente: string }) {
  const [estado, accion, enProceso] = useActionState<EstadoAccion, FormData>(
    iniciarSesion,
    undefined,
  );

  return (
    <div className="space-y-4">
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
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
      </div>

      <BotonGoogle />

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/auth/registro" className="underline underline-offset-4">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
