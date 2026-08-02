"use client";

import { useEffect, useRef, useState } from "react";

import { actualizarPersona } from "@/app/captura/acciones";
import { EXTRANJERO, ESTADOS_MEXICO, MUNICIPIOS_POR_ESTADO, type EstadoMexico } from "@/lib/geografia-mexico";
import { validarCorreo, validarCurp, validarTelefono } from "@/lib/validaciones";
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
  correo: string | null;
  estado_geografico: string | null;
  municipio: string | null;
  localidad: string | null;
  direccion: string | null;
}

type EstadoGuardado = "guardado" | "pendiente" | "guardando" | "error";
type CampoValidado = "curp" | "telefono" | "correo";

const ESPERA_AUTOGUARDADO_MS = 1200;

/**
 * `<SelectValue />` sin hijos solo resuelve la etiqueta del valor elegido
 * si se le pasa `items` a `<Select>` (ver base-ui/react/select/root) — sin
 * eso, muestra el value crudo ("H") en el disparador cerrado, no la
 * etiqueta ("Masculino"), aunque la lista de opciones sí diga lo correcto.
 * Mismo workaround que ya usa fila-jornada.tsx: pasarle la etiqueta como
 * función hija.
 */
const ETIQUETA_SEXO: Record<string, string> = { H: "Masculino", M: "Femenino" };
function etiquetaSexo(valor: unknown): string {
  return (typeof valor === "string" && ETIQUETA_SEXO[valor]) || "Elegir…";
}

function esEstadoConocido(valor: string | null): valor is Exclude<EstadoMexico, typeof EXTRANJERO> {
  return valor !== null && valor !== EXTRANJERO && valor in MUNICIPIOS_POR_ESTADO;
}

function calcularError(campo: CampoValidado, valor: string | null): string | undefined {
  if (!valor) return undefined;
  if (campo === "curp") return validarCurp(valor) ? undefined : "CURP inválida (18 caracteres, formato oficial).";
  if (campo === "telefono") return validarTelefono(valor) ? undefined : "Debe tener 10 dígitos.";
  return validarCorreo(valor) ? undefined : "Correo electrónico inválido.";
}

export function FormularioPersona({ personaId, inicial }: { personaId: string; inicial: DatosPersona }) {
  const [datos, setDatos] = useState(inicial);
  const [errores, setErrores] = useState<Partial<Record<CampoValidado, string>>>({});
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>("guardado");
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  /**
   * Único punto que programa el autoguardado. Si algún campo validado
   * (CURP, teléfono, correo) tiene un error pendiente — sea el que se acaba
   * de tocar o cualquier otro — no se agenda el guardado: es preferible
   * dejar cambios sin guardar a mandar un dato con formato inválido.
   */
  function actualizarVarios(cambios: Partial<DatosPersona>, erroresCambios?: Partial<Record<CampoValidado, string | undefined>>) {
    const siguiente = { ...datos, ...cambios };
    setDatos(siguiente);

    const siguientesErrores = erroresCambios ? { ...errores, ...erroresCambios } : errores;
    if (erroresCambios) setErrores(siguientesErrores);

    setEstadoGuardado("pendiente");
    if (temporizador.current) clearTimeout(temporizador.current);
    if (Object.values(siguientesErrores).some(Boolean)) return;

    temporizador.current = setTimeout(async () => {
      setEstadoGuardado("guardando");
      const r = await actualizarPersona(personaId, siguiente);
      setErrorGuardado(r.error ?? null);
      setEstadoGuardado(r.error ? "error" : "guardado");
    }, ESPERA_AUTOGUARDADO_MS);
  }

  function actualizar<K extends keyof DatosPersona>(campo: K, valor: DatosPersona[K]) {
    if (campo === "curp" || campo === "telefono" || campo === "correo") {
      actualizarVarios({ [campo]: valor } as Partial<DatosPersona>, { [campo]: calcularError(campo, valor as string | null) });
    } else {
      actualizarVarios({ [campo]: valor } as Partial<DatosPersona>);
    }
  }

  /** El municipio elegido casi nunca sigue siendo válido al cambiar de estado — se limpia junto con él. */
  function alCambiarEstado(valor: string) {
    actualizarVarios({ estado_geografico: valor, municipio: null });
  }

  const municipiosDisponibles: readonly string[] = esEstadoConocido(datos.estado_geografico)
    ? MUNICIPIOS_POR_ESTADO[datos.estado_geografico]
    : [];

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
              <SelectValue>{etiquetaSexo}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="H">Masculino</SelectItem>
              <SelectItem value="M">Femenino</SelectItem>
            </SelectContent>
          </Select>
        </Campo>
        <Campo label="CURP" error={errores.curp}>
          <Input
            value={datos.curp ?? ""}
            onChange={(e) => actualizar("curp", e.target.value.toUpperCase() || null)}
            className="uppercase"
            aria-invalid={Boolean(errores.curp)}
          />
        </Campo>
        <Campo label="Teléfono" error={errores.telefono}>
          <Input
            value={datos.telefono ?? ""}
            onChange={(e) => actualizar("telefono", e.target.value || null)}
            aria-invalid={Boolean(errores.telefono)}
          />
        </Campo>
        <Campo label="Teléfono alterno">
          <Input value={datos.telefono_alterno ?? ""} onChange={(e) => actualizar("telefono_alterno", e.target.value || null)} />
        </Campo>
        <Campo label="Correo electrónico" error={errores.correo}>
          <Input
            type="email"
            value={datos.correo ?? ""}
            onChange={(e) => actualizar("correo", e.target.value || null)}
            aria-invalid={Boolean(errores.correo)}
          />
        </Campo>
        <Campo label="Estado">
          <Select value={datos.estado_geografico ?? undefined} onValueChange={(v) => v && alCambiarEstado(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elegir…" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_MEXICO.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo label="Municipio">
          <Select
            value={datos.municipio ?? undefined}
            onValueChange={(v) => v && actualizar("municipio", v)}
            disabled={municipiosDisponibles.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={datos.estado_geografico === EXTRANJERO ? "No aplica" : "Elegir estado primero…"}
              />
            </SelectTrigger>
            <SelectContent>
              {municipiosDisponibles.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo label="Localidad">
          <Input value={datos.localidad ?? ""} onChange={(e) => actualizar("localidad", e.target.value || null)} />
        </Campo>
        <Campo label="Dirección" className="sm:col-span-2">
          <Input value={datos.direccion ?? ""} onChange={(e) => actualizar("direccion", e.target.value || null)} />
        </Campo>
      </div>
      <IndicadorGuardado estado={estadoGuardado} error={errorGuardado} />
    </div>
  );
}

function Campo({
  label,
  className,
  error,
  children,
}: {
  label: string;
  className?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
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
