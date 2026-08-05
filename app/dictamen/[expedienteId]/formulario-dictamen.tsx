"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { modificarDictamen, registrarDictamen } from "@/app/dictamen/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OpcionDictamen } from "@/lib/dictamen";
import type { ResultadoDictamen } from "@/lib/supabase/tipos";

interface ValorInicialDictamen {
  resultado: ResultadoDictamen;
  observaciones: string;
  recomendacion: string;
}

export function FormularioDictamen({
  expedienteId,
  opciones,
  modo = "nuevo",
  valorInicial,
  onCancelar,
}: {
  expedienteId: string;
  /** Catálogo de la jornada (o las 4 salidas originales) — ver lib/dictamen.ts. */
  opciones: OpcionDictamen[];
  /** "modificar" reusa el mismo formulario para corregir un dictamen ya guardado. */
  modo?: "nuevo" | "modificar";
  valorInicial?: ValorInicialDictamen;
  onCancelar?: () => void;
}) {
  const router = useRouter();
  const [resultado, setResultado] = useState<ResultadoDictamen | null>(valorInicial?.resultado ?? null);
  const [observaciones, setObservaciones] = useState(valorInicial?.observaciones ?? "");
  const [recomendacion, setRecomendacion] = useState(valorInicial?.recomendacion ?? "");
  const [confirmado, setConfirmado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enProceso, iniciarTransicion] = useTransition();

  const esModificacion = modo === "modificar";
  const bloqueadoPorConfirmacion = esModificacion && !confirmado;

  function enviar() {
    if (!resultado || bloqueadoPorConfirmacion) return;
    setError(null);
    iniciarTransicion(async () => {
      const accion = esModificacion ? modificarDictamen : registrarDictamen;
      const r = await accion({ expedienteId, resultado, observaciones, recomendacion });
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
        <CardTitle>{esModificacion ? "Modificar dictamen" : "Dictamen"}</CardTitle>
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

        {esModificacion && (
          <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <p className="text-sm">
              Estás modificando un dictamen ya registrado. Si cambias la salida, el folio actual
              puede anularse y se asignará uno nuevo.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={confirmado} onCheckedChange={(v) => setConfirmado(v === true)} />
              Confirmo el cambio
            </label>
          </div>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex gap-2">
          <Button onClick={enviar} disabled={!resultado || enProceso || bloqueadoPorConfirmacion}>
            {enProceso ? "Guardando…" : esModificacion ? "Guardar cambios" : "Registrar dictamen"}
          </Button>
          {esModificacion && onCancelar && (
            <Button type="button" variant="outline" onClick={onCancelar} disabled={enProceso}>
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
