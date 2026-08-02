import Link from "next/link";

import { cerrarSesion } from "@/app/auth/acciones";
import { DESTINO_POR_ROL } from "@/lib/roles";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

/**
 * Header persistente de las pantallas de trabajo (/admin, /captura,
 * /dictamen). Sin logo a propósito: docs/MANUAL-IMAGEN.md §6 ya excluye la
 * marca de estas pantallas porque "estorba" — se mantiene ese criterio aquí.
 */
export async function Encabezado({ modulo }: { modulo: string }) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destino = "/";
  if (user) {
    const { data: perfil } = await supabase
      .from("usuario_perfil")
      .select("rol")
      .eq("id", user.id)
      .maybeSingle();
    destino = perfil?.rol ? DESTINO_POR_ROL[perfil.rol] : "/";
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-2 backdrop-blur">
      <span className="text-sm font-semibold text-foreground">{modulo}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={destino} />}>
          Mi panel
        </Button>
        <form action={cerrarSesion}>
          <Button variant="ghost" size="sm" type="submit">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </header>
  );
}
