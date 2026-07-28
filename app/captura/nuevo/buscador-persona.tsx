"use client";

import { useState, useTransition } from "react";

import { buscarPersonas, crearPersona, historialPersona, type CriteriosBusqueda } from "@/app/captura/acciones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PersonaSeleccionada {
  id: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
}

/** Prellenado al promover un pre-registro (RF-181). Todo es texto plano. */
export interface ValoresPersona {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  telefono: string;
}

interface ResultadoBusqueda {
  id: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  fecha_nacimiento: string;
  sexo: string;
  telefono: string | null;
  similitud: number;
  motivo: string;
}

/** Una persona, con todos los motivos por los que coincidió. */
interface CoincidenciaAgrupada extends Omit<ResultadoBusqueda, "motivo"> {
  motivos: string[];
}

/**
 * `buscar_persona_similar` devuelve una fila **por motivo**, así que quien
 * coincide por nombre y además por teléfono aparece dos veces. Sin agrupar,
 * la pantalla anuncia "2 coincidencias posibles" y muestra dos tarjetas
 * idénticas de la misma persona: el capturista tiene que decidir cuál de las
 * dos es "la buena" cuando no hay tal decisión, con una familia esperando.
 *
 * Coincidir por varios motivos a la vez es evidencia MÁS fuerte de que es la
 * misma persona, no menos — por eso se conserva la similitud más alta y se
 * muestran todos los motivos juntos.
 */
function agruparCoincidencias(filas: ResultadoBusqueda[]): CoincidenciaAgrupada[] {
  const porId = new Map<string, CoincidenciaAgrupada>();

  for (const fila of filas) {
    const previa = porId.get(fila.id);
    if (previa) {
      if (!previa.motivos.includes(fila.motivo)) previa.motivos.push(fila.motivo);
      previa.similitud = Math.max(previa.similitud, fila.similitud);
    } else {
      const { motivo, ...resto } = fila;
      porId.set(fila.id, { ...resto, motivos: [motivo] });
    }
  }

  return [...porId.values()].sort((a, b) => b.similitud - a.similitud);
}

const ETIQUETA_MOTIVO: Record<string, string> = {
  curp: "misma CURP",
  nombre_fecha: "nombre y fecha de nacimiento parecidos",
  nombre: "nombre parecido",
  fecha: "misma fecha de nacimiento",
  telefono: "mismo teléfono",
};

const ETIQUETA_DICTAMEN: Record<string, string> = {
  apto_cirugia: "apto para cirugía",
  apto_laser: "apto para láser",
  no_apto: "no apto",
  regresar_6_meses: "regresar en 6 meses",
};

/**
 * `<SelectValue />` sin hijos ni `items` en `<Select>` muestra el value
 * crudo ("H") en el disparador, no la etiqueta de la opción elegida — bug
 * de base-ui/react/select ya presente antes de este cambio. Mismo
 * workaround que fila-jornada.tsx y formulario-persona.tsx.
 */
const ETIQUETA_SEXO: Record<string, string> = { H: "Masculino", M: "Femenino" };
function etiquetaSexo(valor: unknown): string {
  return (typeof valor === "string" && ETIQUETA_SEXO[valor]) || "Elegir…";
}

type Fase = "buscando" | "resultados" | "creando" | "listo";

interface EntradaHistorial {
  id: string;
  estado: string;
  creado_en: string;
  jornadaNombre: string;
  dictamen: string | null;
}

export function BuscadorPersona({
  titulo,
  descripcion,
  mostrarHistorial,
  valoresIniciales,
  onListo,
}: {
  titulo: string;
  descripcion?: string;
  /** RF-113: al reutilizar un paciente, mostrar sus expedientes y dictámenes previos. */
  mostrarHistorial?: boolean;
  /** Prellenado desde un pre-registro. Siembra la búsqueda, no el alta. */
  valoresIniciales?: ValoresPersona;
  onListo: (persona: PersonaSeleccionada) => void;
}) {
  const [fase, setFase] = useState<Fase>("buscando");
  // Los criterios son también la fuente del formulario de alta más abajo:
  // lo que el capturista corrija al buscar se arrastra a "crear persona
  // nueva" en vez de obligarlo a teclearlo dos veces.
  const [criterios, setCriterios] = useState<CriteriosBusqueda>(() =>
    valoresIniciales
      ? {
          nombre: valoresIniciales.nombre,
          apellidoPaterno: valoresIniciales.apellidoPaterno,
          apellidoMaterno: valoresIniciales.apellidoMaterno,
          fechaNacimiento: valoresIniciales.fechaNacimiento,
          telefono: valoresIniciales.telefono,
        }
      : {},
  );
  const [resultados, setResultados] = useState<CoincidenciaAgrupada[]>([]);
  const [seleccionada, setSeleccionada] = useState<PersonaSeleccionada | null>(null);
  const [historial, setHistorial] = useState<EntradaHistorial[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enProceso, iniciarTransicion] = useTransition();
  // "2. Adulto responsable" -> "2-adulto-responsable": un id de HTML válido,
  // sin espacios ni acentos, para los campos del formulario de alta.
  const idPrefix = titulo
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();

  function buscar() {
    setError(null);
    iniciarTransicion(async () => {
      const r = await buscarPersonas(criterios);
      if (r.error) {
        setError(r.error);
        return;
      }
      setResultados(agruparCoincidencias((r.resultados ?? []) as ResultadoBusqueda[]));
      setFase("resultados");
    });
  }

  function elegir(persona: CoincidenciaAgrupada) {
    const p = { id: persona.id, nombre: persona.nombre, apellido_paterno: persona.apellido_paterno, apellido_materno: persona.apellido_materno };
    setSeleccionada(p);
    setFase("listo");
    setHistorial(null);
    onListo(p);

    if (mostrarHistorial) {
      iniciarTransicion(async () => {
        const r = await historialPersona(persona.id);
        if (r.error || !r.expedientes) return;
        setHistorial(
          r.expedientes.map((e) => {
            const jornada = Array.isArray(e.jornada) ? e.jornada[0] : e.jornada;
            const dictamenRaw = Array.isArray(e.dictamen_etapa1) ? e.dictamen_etapa1[0] : e.dictamen_etapa1;
            return {
              id: e.id,
              estado: e.estado,
              creado_en: e.creado_en,
              jornadaNombre: jornada?.nombre ?? jornada?.clave ?? "jornada desconocida",
              dictamen: dictamenRaw ? ETIQUETA_DICTAMEN[dictamenRaw.resultado] ?? dictamenRaw.resultado : null,
            };
          }),
        );
      });
    }
  }

  function crear(formData: FormData) {
    setError(null);
    setHistorial(null); // persona nueva: sin historial por definición
    const datos = {
      nombre: String(formData.get("nombre") ?? "").trim(),
      apellido_paterno: String(formData.get("apellido_paterno") ?? "").trim(),
      apellido_materno: String(formData.get("apellido_materno") ?? "").trim() || null,
      fecha_nacimiento: String(formData.get("fecha_nacimiento") ?? ""),
      sexo: String(formData.get("sexo") ?? "") as "H" | "M",
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      correo: String(formData.get("correo") ?? "").trim() || null,
      curp: String(formData.get("curp") ?? "").trim().toUpperCase() || null,
    };
    if (!datos.nombre || !datos.apellido_paterno || !datos.fecha_nacimiento || !datos.sexo) {
      setError("Nombre, apellido paterno, fecha de nacimiento y sexo son obligatorios.");
      return;
    }
    iniciarTransicion(async () => {
      const r = await crearPersona(datos);
      if (r.error || !r.persona) {
        setError(r.error ?? "No se pudo crear.");
        return;
      }
      const p = {
        id: r.persona.id,
        nombre: r.persona.nombre,
        apellido_paterno: r.persona.apellido_paterno,
        apellido_materno: r.persona.apellido_materno,
      };
      setSeleccionada(p);
      setFase("listo");
      onListo(p);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        {descripcion ? <CardDescription>{descripcion}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {fase === "listo" && seleccionada && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
              <div>
                <p className="font-medium">
                  {seleccionada.nombre} {seleccionada.apellido_paterno} {seleccionada.apellido_materno ?? ""}
                </p>
                <p className="text-xs text-muted-foreground">Seleccionada</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSeleccionada(null);
                  setHistorial(null);
                  setFase("buscando");
                }}
              >
                Cambiar
              </Button>
            </div>

            {mostrarHistorial && historial && historial.length > 0 && (
              <div className="rounded-md border p-3">
                <p className="mb-2 text-sm font-medium">Ya participó en jornadas anteriores</p>
                <div className="space-y-1">
                  {historial.map((h) => (
                    <p key={h.id} className="text-sm text-muted-foreground">
                      {h.jornadaNombre} —{" "}
                      {h.dictamen ? (
                        <Badge variant="secondary">{h.dictamen}</Badge>
                      ) : (
                        <span>sin dictamen ({h.estado})</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {fase === "buscando" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Busca primero: evita crear a alguien que ya está en el sistema (puede haber
              venido en una jornada anterior).
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>CURP (si la trae)</Label>
                <Input
                  value={criterios.curp ?? ""}
                  onChange={(e) => setCriterios({ ...criterios, curp: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-1">
                <Label>Teléfono</Label>
                <Input
                  value={criterios.telefono ?? ""}
                  onChange={(e) => setCriterios({ ...criterios, telefono: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Nombre(s)</Label>
                <Input
                  value={criterios.nombre ?? ""}
                  onChange={(e) => setCriterios({ ...criterios, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Apellido paterno</Label>
                <Input
                  value={criterios.apellidoPaterno ?? ""}
                  onChange={(e) => setCriterios({ ...criterios, apellidoPaterno: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Apellido materno</Label>
                <Input
                  value={criterios.apellidoMaterno ?? ""}
                  onChange={(e) => setCriterios({ ...criterios, apellidoMaterno: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={criterios.fechaNacimiento ?? ""}
                  onChange={(e) => setCriterios({ ...criterios, fechaNacimiento: e.target.value })}
                />
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="button" onClick={buscar} disabled={enProceso}>
              {enProceso ? "Buscando…" : "Buscar"}
            </Button>
          </div>
        )}

        {fase === "resultados" && (
          <div className="space-y-3">
            {resultados.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {resultados.length} coincidencia{resultados.length === 1 ? "" : "s"} posible
                  {resultados.length === 1 ? "" : "s"}. Confirma con la familia antes de elegir.
                </p>
                {resultados.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">
                        {r.nombre} {r.apellido_paterno} {r.apellido_materno ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Nace {r.fecha_nacimiento} · {r.telefono ?? "sin teléfono"}
                      </p>
                      <p className="mt-1 flex flex-wrap gap-1">
                        {r.motivos.map((motivo) => (
                          <Badge key={motivo} variant="secondary">
                            {ETIQUETA_MOTIVO[motivo] ?? motivo}
                          </Badge>
                        ))}
                      </p>
                    </div>
                    <Button type="button" size="sm" onClick={() => elegir(r)}>
                      Es esta persona
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin coincidencias.</p>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setFase("buscando")}>
                Buscar de nuevo
              </Button>
              <Button type="button" variant="outline" onClick={() => setFase("creando")}>
                Ninguna de estas — crear persona nueva
              </Button>
            </div>
          </div>
        )}

        {fase === "creando" && (
          <form action={crear} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-nombre`}>Nombre(s) *</Label>
                <Input
                  id={`${idPrefix}-nombre`}
                  name="nombre"
                  defaultValue={criterios.nombre ?? ""}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-ap`}>Apellido paterno *</Label>
                <Input
                  id={`${idPrefix}-ap`}
                  name="apellido_paterno"
                  defaultValue={criterios.apellidoPaterno ?? ""}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-am`}>Apellido materno</Label>
                <Input
                  id={`${idPrefix}-am`}
                  name="apellido_materno"
                  defaultValue={criterios.apellidoMaterno ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-fn`}>Fecha de nacimiento *</Label>
                <Input
                  id={`${idPrefix}-fn`}
                  name="fecha_nacimiento"
                  type="date"
                  defaultValue={criterios.fechaNacimiento ?? ""}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-sexo`}>Sexo *</Label>
                <Select name="sexo" required>
                  <SelectTrigger id={`${idPrefix}-sexo`}>
                    <SelectValue>{etiquetaSexo}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="H">Masculino</SelectItem>
                    <SelectItem value="M">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-tel`}>Teléfono</Label>
                <Input
                  id={`${idPrefix}-tel`}
                  name="telefono"
                  inputMode="numeric"
                  pattern="\d{10}"
                  title="10 dígitos"
                  defaultValue={criterios.telefono ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-correo`}>Correo electrónico</Label>
                <Input id={`${idPrefix}-correo`} name="correo" type="email" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`${idPrefix}-curp`}>CURP (si la trae)</Label>
                <Input
                  id={`${idPrefix}-curp`}
                  name="curp"
                  className="uppercase"
                  defaultValue={criterios.curp ?? ""}
                />
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setFase("resultados")}>
                Volver a resultados
              </Button>
              <Button type="submit" disabled={enProceso}>
                {enProceso ? "Guardando…" : "Crear persona"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
