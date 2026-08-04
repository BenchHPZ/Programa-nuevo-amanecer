"use client";

import { useEffect, useRef, useState } from "react";

import { guardarSeccion } from "@/app/captura/acciones";
import { Badge } from "@/components/ui/badge";

import { Campo } from "./campo";
import { type DatosSeccion, type DefinicionCatalogo, normalizarGrupos, seccionCompleta, todosLosCampos } from "./tipos";

type EstadoGuardado = "guardado" | "pendiente" | "guardando" | "error";
const ESPERA_AUTOGUARDADO_MS = 1200;

export function FormularioSeccion({
  expedienteId,
  seccion,
  definicion,
  datosIniciales,
  soloLectura = false,
  motivoSoloLectura = "tu rol no puede editar esta sección",
}: {
  expedienteId: string;
  seccion: "antecedentes" | "socioeconomico";
  definicion: DefinicionCatalogo;
  datosIniciales: DatosSeccion;
  soloLectura?: boolean;
  /** Texto tras "Solo lectura — " cuando `soloLectura` es true. */
  motivoSoloLectura?: string;
}) {
  const [datos, setDatos] = useState<DatosSeccion>(datosIniciales);
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>("guardado");
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const grupos = normalizarGrupos(definicion);
  const camposPlanos = todosLosCampos(definicion);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  function actualizar(clave: string, valor: DatosSeccion[string]) {
    if (soloLectura) return; // defensivo, aunque los inputs ya estén disabled
    const siguiente = { ...datos, [clave]: valor };
    setDatos(siguiente);
    setEstadoGuardado("pendiente");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      setEstadoGuardado("guardando");
      const completa = seccionCompleta(camposPlanos, siguiente);
      const r = await guardarSeccion(expedienteId, seccion, siguiente, completa);
      setErrorGuardado(r.error ?? null);
      setEstadoGuardado(r.error ? "error" : "guardado");
    }, ESPERA_AUTOGUARDADO_MS);
  }

  const completa = seccionCompleta(camposPlanos, datos);

  return (
    <div className="space-y-4">
      {grupos.map((grupo, i) => (
        <div key={grupo.titulo ?? i} className={i > 0 ? "space-y-4 border-t pt-4" : "space-y-4"}>
          {grupo.titulo && (
            <h4 className="text-sm font-medium text-muted-foreground">{grupo.titulo}</h4>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {grupo.campos.map((campo) => (
              <div key={campo.clave} className={campo.tipo === "texto_largo" ? "sm:col-span-2" : undefined}>
                <Campo
                  campo={campo}
                  valor={datos[campo.clave]}
                  onCambio={(v) => actualizar(campo.clave, v)}
                  disabled={soloLectura}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      {soloLectura ? (
        <p className="text-xs text-muted-foreground">Solo lectura — {motivoSoloLectura}.</p>
      ) : (
        <div className="flex items-center justify-between">
          <IndicadorGuardado estado={estadoGuardado} error={errorGuardado} />
          <Badge variant={completa ? "default" : "secondary"}>
            {completa ? "Sección completa" : "Faltan campos obligatorios"}
          </Badge>
        </div>
      )}
    </div>
  );
}

function IndicadorGuardado({ estado, error }: { estado: EstadoGuardado; error?: string | null }) {
  const texto: Record<EstadoGuardado, string> = {
    guardado: "Guardado",
    pendiente: "Cambios sin guardar…",
    guardando: "Guardando…",
    // Se muestra el motivo real cuando lo hay — "revisa tu conexión" era un
    // texto genérico que ocultaba la causa real (p. ej. RLS, formato, un
    // esquema desincronizado) tanto a quien captura como a quien depura.
    error: error ? `No se pudo guardar: ${error}` : "No se pudo guardar — revisa tu conexión",
  };
  const color: Record<EstadoGuardado, string> = {
    guardado: "text-muted-foreground",
    pendiente: "text-amber-600",
    guardando: "text-muted-foreground",
    error: "text-destructive",
  };
  return <p className={`text-xs ${color[estado]}`}>{texto[estado]}</p>;
}
