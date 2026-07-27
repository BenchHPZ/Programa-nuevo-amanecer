"use client";

import { useEffect, useRef, useState } from "react";

import { actualizarPersona } from "@/app/captura/acciones";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatosPersona {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  fecha_nacimiento: string;
  sexo: string;
  curp: string | null;
  telefono: string | null;
  telefono_alterno: string | null;
  estado_geografico: string | null;
  municipio: string | null;
  localidad: string | null;
  direccion: string | null;
}

type EstadoGuardado = "guardado" | "pendiente" | "guardando" | "error";

const ESPERA_AUTOGUARDADO_MS = 1200;

export function FormularioPersona({ personaId, inicial }: { personaId: string; inicial: DatosPersona }) {
  const [datos, setDatos] = useState(inicial);
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>("guardado");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  function actualizar<K extends keyof DatosPersona>(campo: K, valor: DatosPersona[K]) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    setEstadoGuardado("pendiente");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      setEstadoGuardado("guardando");
      const r = await actualizarPersona(personaId, { ...datos, [campo]: valor });
      setEstadoGuardado(r.error ? "error" : "guardado");
    }, ESPERA_AUTOGUARDADO_MS);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Nombre(s)">
          <Input value={datos.nombre} onChange={(e) => actualizar("nombre", e.target.value)} />
        </Campo>
        <Campo label="Apellido paterno">
          <Input value={datos.apellido_paterno} onChange={(e) => actualizar("apellido_paterno", e.target.value)} />
        </Campo>
        <Campo label="Apellido materno">
          <Input value={datos.apellido_materno ?? ""} onChange={(e) => actualizar("apellido_materno", e.target.value || null)} />
        </Campo>
        <Campo label="Fecha de nacimiento">
          <Input type="date" value={datos.fecha_nacimiento} onChange={(e) => actualizar("fecha_nacimiento", e.target.value)} />
        </Campo>
        <Campo label="Sexo">
          <Select value={datos.sexo} onValueChange={(v) => v && actualizar("sexo", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="H">Hombre</SelectItem>
              <SelectItem value="M">Mujer</SelectItem>
            </SelectContent>
          </Select>
        </Campo>
        <Campo label="CURP">
          <Input
            value={datos.curp ?? ""}
            onChange={(e) => actualizar("curp", e.target.value.toUpperCase() || null)}
            className="uppercase"
          />
        </Campo>
        <Campo label="Teléfono">
          <Input value={datos.telefono ?? ""} onChange={(e) => actualizar("telefono", e.target.value || null)} />
        </Campo>
        <Campo label="Teléfono alterno">
          <Input value={datos.telefono_alterno ?? ""} onChange={(e) => actualizar("telefono_alterno", e.target.value || null)} />
        </Campo>
        <Campo label="Estado">
          <Input value={datos.estado_geografico ?? ""} onChange={(e) => actualizar("estado_geografico", e.target.value || null)} />
        </Campo>
        <Campo label="Municipio">
          <Input value={datos.municipio ?? ""} onChange={(e) => actualizar("municipio", e.target.value || null)} />
        </Campo>
        <Campo label="Localidad">
          <Input value={datos.localidad ?? ""} onChange={(e) => actualizar("localidad", e.target.value || null)} />
        </Campo>
        <Campo label="Dirección" className="sm:col-span-2">
          <Input value={datos.direccion ?? ""} onChange={(e) => actualizar("direccion", e.target.value || null)} />
        </Campo>
      </div>
      <IndicadorGuardado estado={estadoGuardado} />
    </div>
  );
}

function Campo({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
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
