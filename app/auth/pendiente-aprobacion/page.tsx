import { cerrarSesion } from "@/app/auth/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaginaPendienteAprobacion() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Cuenta pendiente de aprobación</CardTitle>
          <CardDescription>
            Tu cuenta fue creada correctamente. Un administrativo del programa debe aprobarla y
            asignarte un rol antes de que puedas ver o capturar información.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={cerrarSesion}>
            <Button type="submit" variant="outline" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
