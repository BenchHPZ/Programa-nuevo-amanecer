import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/marca/logo";

import { FormularioInicioSesion } from "./formulario";

export default async function PaginaIniciarSesion({
  searchParams,
}: {
  searchParams: Promise<{ siguiente?: string }>;
}) {
  const { siguiente } = await searchParams;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/30 p-4">
      <Logo ancho={200} prioridad />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Sistema de gestión de jornadas</CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioInicioSesion siguiente={siguiente ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
