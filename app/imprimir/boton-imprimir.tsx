"use client";

import { Button } from "@/components/ui/button";

/** Cero PDF en servidor: la impresión es window.print() sobre la plantilla ya estilizada. */
export function BotonImprimir() {
  return <Button onClick={() => window.print()}>Imprimir</Button>;
}
