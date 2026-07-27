import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaginaSinPermiso() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sin permiso para esta sección</CardTitle>
          <CardDescription>
            Tu rol actual no incluye acceso a esta parte del sistema. Si crees que es un error,
            contacta a un administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" nativeButton={false} render={<Link href="/" />}>
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
