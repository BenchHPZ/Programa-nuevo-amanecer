"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { registrarColaborador } from "./acciones";

const PERFILES = [
  {
    id: "medico",
    titulo: "Personal médico",
    descripcion: "Cirugía, anestesiología, pediatría, otorrinolaringología, ortodoncia, terapia de lenguaje.",
  },
  {
    id: "enfermeria_estudiante",
    titulo: "Enfermería y estudiantes",
    descripcion: "Enfermería titulada o en formación, y servicio social.",
  },
  {
    id: "apoyo_general",
    titulo: "Apoyo general",
    descripcion: "Logística, traslados, alimentos, registro. No se necesita formación médica.",
  },
  {
    id: "donativo",
    titulo: "Donativos y empresas",
    descripcion: "Insumos médicos, recursos o servicios, a nombre propio o de una organización.",
  },
] as const;

/**
 * Patrón probado del repositorio: estado controlado + `<Button onClick>` +
 * `useTransition`. **No** `<form action>` con `type="submit"` — ese idioma se
 * usó una vez en el pre-registro y el envío fallaba en silencio: ni petición,
 * ni error, ni pista.
 */
export function FormularioColaborador() {
  const [tipo, setTipo] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [comentarios, setComentarios] = useState("");

  const [especialidad, setEspecialidad] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [cedula, setCedula] = useState("");
  const [aniosExperiencia, setAniosExperiencia] = useState("");
  const [carrera, setCarrera] = useState("");
  const [semestre, setSemestre] = useState("");
  const [servicioSocial, setServicioSocial] = useState(false);
  const [areaInteres, setAreaInteres] = useState("");
  const [disponibilidad, setDisponibilidad] = useState("");
  const [organizacion, setOrganizacion] = useState("");
  const [tipoApoyo, setTipoApoyo] = useState("");

  const [aceptaAviso, setAceptaAviso] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enProceso, iniciarTransicion] = useTransition();

  function enviar() {
    setError(null);
    iniciarTransicion(async () => {
      const r = await registrarColaborador({
        tipo,
        nombre,
        correo,
        telefono,
        ciudad,
        comentarios,
        especialidad,
        institucion,
        cedula,
        aniosExperiencia,
        carrera,
        semestre,
        servicioSocial,
        areaInteres,
        disponibilidad,
        organizacion,
        tipoApoyo,
        aceptaAviso,
        sitioWeb: honeypotRef.current?.value ?? "",
      });
      if (r.error) {
        setError(r.error);
        return;
      }
      setEnviado(true);
    });
  }

  if (enviado) {
    return (
      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle>Gracias por ofrecer su apoyo</CardTitle>
          <CardDescription>
            Recibimos sus datos. Alguien del equipo se pondrá en contacto antes de la próxima
            jornada. Esto no es una inscripción confirmada: falta que la asociación lo revise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. ¿Cómo le gustaría colaborar?</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {PERFILES.map((p) => (
            <label
              key={p.id}
              htmlFor={`perfil-${p.id}`}
              className={`flex cursor-pointer gap-3 rounded-md border p-3 transition-colors ${
                tipo === p.id ? "border-primary bg-accent" : "hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                id={`perfil-${p.id}`}
                name="perfil"
                value={p.id}
                checked={tipo === p.id}
                onChange={() => setTipo(p.id)}
                className="mt-1 shrink-0"
              />
              <span>
                <span className="block text-sm font-medium">{p.titulo}</span>
                <span className="block text-xs text-muted-foreground">{p.descripcion}</span>
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      {tipo && (
        <Card>
          <CardHeader>
            <CardTitle>2. Sus datos</CardTitle>
            <CardDescription>
              Pedimos lo mínimo para poder contactarle. Nombre y una forma de contacto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="nombre">Nombre completo *</Label>
                <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="correo">Correo electrónico</Label>
                <Input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="telefono">Teléfono (10 dígitos)</Label>
                <Input
                  id="telefono"
                  inputMode="numeric"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input id="ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
              </div>

              {tipo === "medico" && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="especialidad">Especialidad</Label>
                    <Input
                      id="especialidad"
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value)}
                      placeholder="cirugía plástica, anestesiología…"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="institucion">Institución donde labora</Label>
                    <Input
                      id="institucion"
                      value={institucion}
                      onChange={(e) => setInstitucion(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cedula">Cédula profesional</Label>
                    <Input id="cedula" value={cedula} onChange={(e) => setCedula(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="anios">Años de experiencia</Label>
                    <Input
                      id="anios"
                      inputMode="numeric"
                      value={aniosExperiencia}
                      onChange={(e) => setAniosExperiencia(e.target.value)}
                    />
                  </div>
                </>
              )}

              {tipo === "enfermeria_estudiante" && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="institucion">Institución o universidad</Label>
                    <Input
                      id="institucion"
                      value={institucion}
                      onChange={(e) => setInstitucion(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="carrera">Carrera</Label>
                    <Input
                      id="carrera"
                      value={carrera}
                      onChange={(e) => setCarrera(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="semestre">Semestre</Label>
                    <Input
                      id="semestre"
                      value={semestre}
                      onChange={(e) => setSemestre(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="servicioSocial"
                      checked={servicioSocial}
                      onChange={(e) => setServicioSocial(e.target.checked)}
                    />
                    <Label htmlFor="servicioSocial">Es para servicio social</Label>
                  </div>
                </>
              )}

              {tipo === "apoyo_general" && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="areaInteres">¿En qué le gustaría ayudar?</Label>
                    <Input
                      id="areaInteres"
                      value={areaInteres}
                      onChange={(e) => setAreaInteres(e.target.value)}
                      placeholder="registro, traslados, alimentos…"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="disponibilidad">Días que puede apoyar</Label>
                    <Input
                      id="disponibilidad"
                      value={disponibilidad}
                      onChange={(e) => setDisponibilidad(e.target.value)}
                      placeholder="toda la semana, solo fines de semana…"
                    />
                  </div>
                </>
              )}

              {tipo === "donativo" && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="organizacion">Organización</Label>
                    <Input
                      id="organizacion"
                      value={organizacion}
                      onChange={(e) => setOrganizacion(e.target.value)}
                      placeholder="si aplica"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tipoApoyo">Tipo de apoyo</Label>
                    <Input
                      id="tipoApoyo"
                      value={tipoApoyo}
                      onChange={(e) => setTipoApoyo(e.target.value)}
                      placeholder="insumos, recursos, servicios…"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="comentarios">Comentarios</Label>
                <Textarea
                  id="comentarios"
                  rows={3}
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                />
              </div>
            </div>

            {/*
              Honeypot. Invisible para una persona, irresistible para un bot que
              rellena todo lo que encuentra. `aria-hidden` y tabIndex -1 para que
              un lector de pantalla tampoco lo anuncie.
            */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="sitioWeb">No llenar este campo</label>
              <input id="sitioWeb" ref={honeypotRef} type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="flex items-start gap-2 border-t pt-4">
              <input
                type="checkbox"
                id="aceptaAviso"
                checked={aceptaAviso}
                onChange={(e) => setAceptaAviso(e.target.checked)}
                className="mt-1"
              />
              <Label htmlFor="aceptaAviso" className="text-sm font-normal">
                He leído y acepto el{" "}
                <Link href="/aviso-de-privacidad" className="underline" target="_blank">
                  aviso de privacidad
                </Link>
                . *
              </Label>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button onClick={enviar} disabled={enProceso}>
              {enProceso ? "Enviando…" : "Enviar registro"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
