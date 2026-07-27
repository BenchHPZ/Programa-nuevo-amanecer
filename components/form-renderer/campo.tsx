"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import type { CampoCatalogo, ValorCampo } from "./tipos";

interface Props {
  campo: CampoCatalogo;
  valor: ValorCampo;
  onCambio: (valor: ValorCampo) => void;
}

/** Un campo del catálogo, renderizado según su `tipo`. */
export function Campo({ campo, valor, onCambio }: Props) {
  const id = `campo-${campo.clave}`;

  return (
    <div className="space-y-1">
      {campo.tipo !== "booleano" && (
        <Label htmlFor={id}>
          {campo.etiqueta}
          {campo.requerido ? <span className="text-destructive"> *</span> : null}
        </Label>
      )}

      {campo.tipo === "texto" && (
        <Input id={id} value={(valor as string) ?? ""} onChange={(e) => onCambio(e.target.value)} />
      )}

      {campo.tipo === "texto_largo" && (
        <Textarea id={id} value={(valor as string) ?? ""} onChange={(e) => onCambio(e.target.value)} rows={3} />
      )}

      {campo.tipo === "numero" && (
        <Input
          id={id}
          type="number"
          value={valor === null || valor === undefined ? "" : String(valor)}
          onChange={(e) => onCambio(e.target.value === "" ? null : Number(e.target.value))}
        />
      )}

      {campo.tipo === "fecha" && (
        <Input id={id} type="date" value={(valor as string) ?? ""} onChange={(e) => onCambio(e.target.value)} />
      )}

      {campo.tipo === "booleano" && (
        <div className="flex items-center gap-2 py-1">
          <Switch id={id} checked={Boolean(valor)} onCheckedChange={(v) => onCambio(v)} />
          <Label htmlFor={id} className="cursor-pointer">
            {campo.etiqueta}
            {campo.requerido ? <span className="text-destructive"> *</span> : null}
          </Label>
        </div>
      )}

      {campo.tipo === "seleccion" && (
        <Select value={(valor as string) ?? ""} onValueChange={(v) => v && onCambio(v)}>
          <SelectTrigger id={id}>
            <SelectValue placeholder="Elegir…" />
          </SelectTrigger>
          <SelectContent>
            {(campo.opciones ?? []).map((op) => (
              <SelectItem key={op} value={op}>
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {campo.tipo === "seleccion_multiple" && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
          {(campo.opciones ?? []).map((op) => {
            const actuales = Array.isArray(valor) ? valor : [];
            const marcado = actuales.includes(op);
            return (
              <div key={op} className="flex items-center gap-2">
                <Checkbox
                  id={`${id}-${op}`}
                  checked={marcado}
                  onCheckedChange={(v) => {
                    const siguiente = v ? [...actuales, op] : actuales.filter((x) => x !== op);
                    onCambio(siguiente);
                  }}
                />
                <Label htmlFor={`${id}-${op}`} className="cursor-pointer font-normal">
                  {op}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      {campo.ayuda ? <p className="text-xs text-muted-foreground">{campo.ayuda}</p> : null}
    </div>
  );
}
