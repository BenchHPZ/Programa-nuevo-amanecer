"use client";

import { useState, useTransition } from "react";

import { guardarCatalogoDictamen } from "./acciones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function EditorDictamenOpciones({
  jornadaId,
  version,
  definicionInicial,
}: {
  jornadaId: string;
  version: number | null;
  definicionInicial: string;
}) {
  const [texto, setTexto] = useState(definicionInicial);
  const [versionActual, setVersionActual] = useState(version);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [enProceso, iniciarTransicion] = useTransition();

  function guardar() {
    setMensaje(null);
    iniciarTransicion(async () => {
      const r = await guardarCatalogoDictamen(jornadaId, texto);
      if (r.error) {
        setMensaje({ tipo: "error", texto: r.error });
        return;
      }
      setVersionActual(r.version ?? null);
      setMensaje({ tipo: "ok", texto: `Guardado como versión ${r.version}.` });
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Salidas del dictamen</CardTitle>
          {versionActual ? <Badge variant="secondary">versión {versionActual}</Badge> : null}
        </div>
        <CardDescription>
          JSON con la forma{" "}
          <code>{"{ opciones: [{ resultado, etiqueta, descripcion? }] }"}</code>. El orden del
          arreglo es el orden en que se muestran los botones al médico.{" "}
          <code>resultado</code> debe ser uno de: apto_cirugia, apto_laser, no_apto,
          regresar_6_meses, cirugia_guanajuato, cirugia_leon.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={16}
          className="font-mono text-xs"
          spellCheck={false}
        />
        {mensaje && (
          <p className={`text-sm ${mensaje.tipo === "error" ? "text-destructive" : "text-green-700"}`}>
            {mensaje.texto}
          </p>
        )}
        <Button onClick={guardar} disabled={enProceso}>
          {enProceso ? "Guardando…" : "Guardar como nueva versión"}
        </Button>
      </CardContent>
    </Card>
  );
}
