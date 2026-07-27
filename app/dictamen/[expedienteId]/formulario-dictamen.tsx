"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { registrarDictamen } from "@/app/dictamen/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ResultadoDictamen } from "@/lib/supabase/tipos";

const SALIDAS: { valor: ResultadoDictamen; etiqueta: string; descripcion: string }[] = [
  { valor: "apto_cirugia", etiqueta: "Apto para cirugía", descripcion: "Se le asigna folio de cirugía." },
  { valor: "apto_laser", etiqueta: "Apto para láser", descripcion: "Se le asigna folio de láser." },
  { valor: "no_apto", etiqueta: "No apto", descripcion: "Requiere recomendación de canalización." },
  { valor: "regresar_6_meses", etiqueta: "Regresar en 6 meses", descripcion: "Sin folio; queda documentado el motivo." },
];

export function FormularioDictamen({ expedienteId }: { expedienteId: string }) {
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
          {SALIDAS.map((s) => (
            <button
              key={s.valor}
              type="button"
              onClick={() => setResultado(s.valor)}
              aria-pressed={resultado === s.valor}
              className={`rounded-md border p-3 text-left transition-colors ${
                resultado === s.valor ? "border-primary bg-primary/10" : "border-input hover:bg-muted/50"
              }`}
            >
              <p className="font-medium">{s.etiqueta}</p>
              <p className="text-xs text-muted-foreground">{s.descripcion}</p>
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
