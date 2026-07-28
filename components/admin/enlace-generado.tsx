"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Un enlace de invitación o de restablecimiento recién generado, para
 * copiar — nunca se envía solo desde el sistema (decisión confirmada: el
 * admin decide cómo compartirlo, ver plan de gestión de usuarios).
 */
export function EnlaceGenerado({ enlace }: { enlace: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <div className="mt-2 flex items-center gap-2 rounded-md border bg-muted/30 p-2 text-xs">
      <input
        readOnly
        value={enlace}
        className="min-w-0 flex-1 bg-transparent font-mono outline-none"
        onFocus={(e) => e.target.select()}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={async () => {
          await navigator.clipboard.writeText(enlace);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        }}
      >
        {copiado ? "Copiado" : "Copiar"}
      </Button>
    </div>
  );
}
