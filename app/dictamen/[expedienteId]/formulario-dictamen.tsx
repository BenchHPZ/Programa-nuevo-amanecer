"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { registrarDictamen } from "@/app/dictamen/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OpcionDictamen } from "@/lib/dictamen";
import type { ResultadoDictamen } from "@/lib/supabase/tipos";

export function FormularioDictamen({
  expedienteId,
  opciones,
}: {
  expedienteId: string;
  /** Catálogo de la jornada (o las 4 salidas originales) — ver lib/dictamen.ts. */
  opciones: OpcionDictamen[];
}) {
  const router = useRouter();
  const [resultado, setResultado] = useState<ResultadoDictamen | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [recomendacion, setRecomendacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enProceso, iniciarTransicion] = useTransition();

  function enviar() {
    if (!resultado) return;
    setError(null);
    iniciarTransicion(async () => {
      const r = await registrarDictamen({ expedienteId, resultado, observaciones, recomendacion });
      if (r.error) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dictamen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {opciones.map((o) => (
            <button
              key={o.resultado}
              type="button"
              onClick={() => setResultado(o.resultado)}
              aria-pressed={resultado === o.resultado}
              className={`rounded-md border p-3 text-left transition-colors ${
                resultado === o.resultado ? "border-primary bg-primary/10" : "border-input hover:bg-muted/50"
              }`}
            >
              <p className="font-medium">{o.etiqueta}</p>
              {o.descripcion && <p className="text-xs text-muted-foreground">{o.descripcion}</p>}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea id="observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3} />
        </div>

        {resultado === "no_apto" && (
          <div className="space-y-1">
            <Label htmlFor="recomendacion">Recomendación / canalización</Label>
            <Textarea id="recomendacion" value={recomendacion} onChange={(e) => setRecomendacion(e.target.value)} rows={3} />
          </div>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button onClick={enviar} disabled={!resultado || enProceso}>
          {enProceso ? "Guardando…" : "Registrar dictamen"}
        </Button>
      </CardContent>
    </Card>
  );
}
