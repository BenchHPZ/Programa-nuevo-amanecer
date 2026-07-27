"use client";

import { useEffect, useRef, useState } from "react";

import { guardarSeccion } from "@/app/captura/acciones";
import { Badge } from "@/components/ui/badge";

import { Campo } from "./campo";
import { type CampoCatalogo, type DatosSeccion, seccionCompleta } from "./tipos";

type EstadoGuardado = "guardado" | "pendiente" | "guardando" | "error";
const ESPERA_AUTOGUARDADO_MS = 1200;

export function FormularioSeccion({
  expedienteId,
  seccion,
  campos,
  datosIniciales,
}: {
  expedienteId: string;
  seccion: "antecedentes" | "socioeconomico";
  campos: CampoCatalogo[];
  datosIniciales: DatosSeccion;
}) {
  const [datos, setDatos] = useState<DatosSeccion>(datosIniciales);
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>("guardado");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  function actualizar(clave: string, valor: DatosSeccion[string]) {
    const siguiente = { ...datos, [clave]: valor };
    setDatos(siguiente);
    setEstadoGuardado("pendiente");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      setEstadoGuardado("guardando");
      const completa = seccionCompleta(campos, siguiente);
      const r = await guardarSeccion(expedienteId, seccion, siguiente, completa);
      setEstadoGuardado(r.error ? "error" : "guardado");
    }, ESPERA_AUTOGUARDADO_MS);
  }

  const completa = seccionCompleta(campos, datos);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {campos.map((campo) => (
          <div key={campo.clave} className={campo.tipo === "texto_largo" ? "sm:col-span-2" : undefined}>
            <Campo campo={campo} valor={datos[campo.clave]} onCambio={(v) => actualizar(campo.clave, v)} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <IndicadorGuardado estado={estadoGuardado} />
        <Badge variant={completa ? "default" : "secondary"}>
          {completa ? "Sección completa" : "Faltan campos obligatorios"}
        </Badge>
      </div>
    </div>
  );
}

function IndicadorGuardado({ estado }: { estado: EstadoGuardado }) {
  const texto: Record<EstadoGuardado, string> = {
    guardado: "Guardado",
    pendiente: "Cambios sin guardar…",
    guardando: "Guardando…",
    error: "No se pudo guardar — revisa tu conexión",
  };
  const color: Record<EstadoGuardado, string> = {
    guardado: "text-muted-foreground",
    pendiente: "text-amber-600",
    guardando: "text-muted-foreground",
    error: "text-destructive",
  };
  return <p className={`text-xs ${color[estado]}`}>{texto[estado]}</p>;
}
