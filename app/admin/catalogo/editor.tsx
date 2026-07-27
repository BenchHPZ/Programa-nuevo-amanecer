"use client";

import { useState, useTransition } from "react";

import { guardarCatalogo } from "./acciones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function EditorCatalogo({
  jornadaId,
  seccion,
  titulo,
  version,
  definicionInicial,
}: {
  jornadaId: string;
  seccion: "antecedentes" | "socioeconomico";
  titulo: string;
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
      const r = await guardarCatalogo(jornadaId, seccion, texto);
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
          <CardTitle>{titulo}</CardTitle>
          {versionActual ? <Badge variant="secondary">versión {versionActual}</Badge> : null}
        </div>
        <CardDescription>
          JSON con la forma <code>{"{ campos: [{ clave, etiqueta, tipo, requerido?, opciones? }] }"}</code>.
          Tipos válidos: texto, texto_largo, numero, booleano, fecha, seleccion, seleccion_multiple.
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
