"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";

import { crearPreRegistro } from "./acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SERVICIOS = [
  { valor: "cirugia", etiqueta: "Cirugía" },
  { valor: "laser", etiqueta: "Láser" },
  { valor: "no_seguro", etiqueta: "No estoy seguro" },
] as const;

export function FormularioPreRegistro() {
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [servicio, setServicio] = useState<(typeof SERVICIOS)[number]["valor"] | null>(null);
  const [aceptaAviso, setAceptaAviso] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enProceso, iniciarTransicion] = useTransition();
  const honeypotRef = useRef<HTMLInputElement>(null);

  function enviar() {
    setError(null);
    iniciarTransicion(async () => {
      const r = await crearPreRegistro({
        nombrePaciente,
        nombreContacto,
        telefono,
        fechaNacimiento,
        servicio: servicio ?? "",
        municipio,
        comentarios,
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
      <Card>
        <CardContent className="space-y-2 pt-6 text-center">
          <p className="text-lg font-medium">Recibimos tu pre-registro.</p>
          <p className="text-muted-foreground">
            Un miembro del equipo se pondrá en contacto contigo. También puedes presentarte
            directamente en la sede durante la jornada.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {/* Honeypot: invisible para personas, visible para bots de envío automático. */}
        <input
          ref={honeypotRef}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="nombrePaciente">Nombre del paciente *</Label>
            <Input id="nombrePaciente" value={nombrePaciente} onChange={(e) => setNombrePaciente(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
            <Input id="fechaNacimiento" type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nombreContacto">Nombre de quien pre-registra *</Label>
            <Input id="nombreContacto" value={nombreContacto} onChange={(e) => setNombreContacto(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="telefono">Teléfono (10 dígitos) *</Label>
            <Input
              id="telefono"
              inputMode="numeric"
              pattern="\d{10}"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="municipio">Municipio</Label>
            <Input id="municipio" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1">
          <Label>¿Qué servicio crees que necesitas?</Label>
          <div className="flex flex-wrap gap-2">
            {SERVICIOS.map((s) => (
              <button
                key={s.valor}
                type="button"
                onClick={() => setServicio(s.valor)}
                aria-pressed={servicio === s.valor}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  servicio === s.valor ? "border-primary bg-primary/10" : "border-input hover:bg-muted/50"
                }`}
              >
                {s.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="comentarios">Comentarios</Label>
          <Textarea id="comentarios" value={comentarios} onChange={(e) => setComentarios(e.target.value)} rows={3} />
        </div>

        <div className="flex items-start gap-2">
          <input
            id="aceptaAviso"
            type="checkbox"
            checked={aceptaAviso}
            onChange={(e) => setAceptaAviso(e.target.checked)}
            className="mt-1"
          />
          <Label htmlFor="aceptaAviso" className="cursor-pointer font-normal">
            He leído y acepto el{" "}
            <Link href="/aviso-de-privacidad" target="_blank" className="text-primary underline">
              aviso de privacidad
            </Link>
            . *
          </Label>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button onClick={enviar} disabled={!aceptaAviso || enProceso}>
          {enProceso ? "Enviando…" : "Enviar pre-registro"}
        </Button>
      </CardContent>
    </Card>
  );
}
