import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { FormularioNuevaContrasena } from "./formulario";

/**
 * Adonde caen los enlaces de invitación y de restablecimiento
 * (/auth/callback ya convirtió el enlace en una sesión real antes de
 * llegar aquí). Sin sesión no hay a quién cambiarle la contraseña.
 */
export default async function PaginaNuevaContrasena() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/iniciar-sesion");

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Elige tu contraseña</CardTitle>
          <CardDescription>
            Este enlace es de un solo uso. Al guardar, entras directo al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioNuevaContrasena />
        </CardContent>
      </Card>
    </div>
  );
}
