"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { crearExpedienteConResponsable, vincularPreRegistro } from "@/app/captura/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { BuscadorPersona, type PersonaSeleccionada, type ValoresPersona } from "./buscador-persona";

const PARENTESCOS = ["madre", "padre", "abuela", "abuelo", "tía", "tío", "hermana", "hermano", "tutor(a) legal", "otro"];

export interface ValoresIniciales {
  paciente: ValoresPersona;
  responsable: ValoresPersona;
}

export function AsistenteNuevoExpediente({
  jornadaId,
  preRegistroId,
  valoresIniciales,
}: {
  jornadaId: string;
  /** Presente solo al promover desde la bandeja pública (RF-181). */
  preRegistroId?: string;
  valoresIniciales?: ValoresIniciales | null;
}) {
  const router = useRouter();
  const [paciente, setPaciente] = useState<PersonaSeleccionada | null>(null);
  const [responsable, setResponsable] = useState<PersonaSeleccionada | null>(null);
  const [parentesco, setParentesco] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enProceso, iniciarTransicion] = useTransition();

  const mismaPersona = paciente && responsable && paciente.id === responsable.id;

  function crear() {
    if (!paciente || !responsable || !parentesco) return;
    setError(null);
    iniciarTransicion(async () => {
      const r = await crearExpedienteConResponsable({
        pacienteId: paciente.id,
        responsableId: responsable.id,
        parentesco,
        jornadaId,
      });
      if (r.error) {
        setError(r.error);
        return;
      }

      // El expediente ya existe; cerrar la bandeja es secundario. Si esto
      // falla, se avisa pero no se bloquea al capturista: el pre-registro
      // quedaría pendiente y a lo sumo alguien lo revisa de más, que es
      // mucho menos grave que perder el expediente recién creado.
      if (preRegistroId && r.expedienteId) {
        const vinculo = await vincularPreRegistro(preRegistroId, r.expedienteId);
        if (vinculo.error) {
          console.error("No se pudo cerrar el pre-registro:", vinculo.error);
        }
      }

      router.push(`/captura/${r.expedienteId}`);
    });
  }

  return (
    <div className="space-y-6">
      <BuscadorPersona
        titulo="1. Paciente"
        descripcion="La persona que busca ser atendida."
        mostrarHistorial
        valoresIniciales={valoresIniciales?.paciente}
        onListo={setPaciente}
      />

      {paciente && (
        <BuscadorPersona
          titulo="2. Adulto responsable"
          descripcion="Obligatorio aunque el paciente sea mayor de edad."
          valoresIniciales={valoresIniciales?.responsable}
          onListo={setResponsable}
        />
      )}

      {mismaPersona && (
        <p className="text-sm text-destructive">
          El paciente y el responsable no pueden ser la misma persona. Vuelve a buscar al
          responsable.
        </p>
      )}

      {paciente && responsable && !mismaPersona && (
        <Card>
          <CardHeader>
            <CardTitle>3. Parentesco y confirmación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="parentesco">¿Qué es el responsable del paciente?</Label>
              <Input
                id="parentesco"
                list="parentescos"
                value={parentesco}
                onChange={(e) => setParentesco(e.target.value)}
                placeholder="madre, padre, tutor(a)…"
              />
              <datalist id="parentescos">
                {PARENTESCOS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button onClick={crear} disabled={!parentesco || enProceso}>
              {enProceso ? "Creando expediente…" : "Crear expediente"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
