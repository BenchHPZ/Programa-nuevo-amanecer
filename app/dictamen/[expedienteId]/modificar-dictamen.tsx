"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { OpcionDictamen } from "@/lib/dictamen";
import type { ResultadoDictamen } from "@/lib/supabase/tipos";

import { FormularioDictamen } from "./formulario-dictamen";

/**
 * Botón que revela el mismo FormularioDictamen en modo "modificar", prellenado
 * con el dictamen actual. Colapsado por defecto: modificar un dictamen ya
 * emitido no es la operación común, no debe verse como un formulario siempre
 * abierto junto al resultado ya registrado.
 */
export function ModificarDictamen({
  expedienteId,
  opciones,
  valorInicial,
}: {
  expedienteId: string;
  opciones: OpcionDictamen[];
  valorInicial: {
    resultado: ResultadoDictamen;
    observaciones: string;
    recomendacion: string;
  };
}) {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <Button variant="outline" size="sm" onClick={() => setAbierto(true)}>
        Modificar dictamen
      </Button>
    );
  }

  return (
    <FormularioDictamen
      expedienteId={expedienteId}
      opciones={opciones}
      modo="modificar"
      valorInicial={valorInicial}
      onCancelar={() => setAbierto(false)}
    />
  );
}
