import Link from "next/link";

import { ESTADOS, RESULTADOS, SERVICIOS, SIN_DICTAMEN, type FiltrosExpediente } from "@/lib/expedientes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const ETIQUETA_ESTADO: Record<string, string> = {
  borrador: "Borrador",
  completo: "Completo",
  dictaminado: "Dictaminado",
};

export const ETIQUETA_SERVICIO: Record<string, string> = {
  cirugia: "Cirugía",
  laser: "Láser",
};

export const ETIQUETA_RESULTADO: Record<string, string> = {
  apto_cirugia: "Apto para cirugía",
  apto_laser: "Apto para láser",
  no_apto: "No apto",
  regresar_6_meses: "Regresar en 6 meses",
  cirugia_guanajuato: "Apto — cirugía Guanajuato",
  cirugia_leon: "Apto — cirugía León",
};

const CLASES_SELECT =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/**
 * Formulario GET puro: los filtros viven en la URL, así que se puede compartir
 * o guardar un listado filtrado, el botón «atrás» se comporta como se espera y
 * la exportación recibe exactamente los mismos parámetros.
 *
 * Sin `"use client"` a propósito. Es la pantalla desde la que se coordina la
 * jornada; que siga funcionando aunque el JavaScript falle no es purismo.
 */
export function FiltrosExpedientes({ filtros }: { filtros: FiltrosExpediente }) {
  return (
    <form method="get" className="grid items-end gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div className="space-y-1">
        <Label htmlFor="f-estado">Estado</Label>
        <select id="f-estado" name="estado" defaultValue={filtros.estado ?? ""} className={CLASES_SELECT}>
          <option value="">Todos</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ETIQUETA_ESTADO[e]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="f-dictamen">Dictamen</Label>
        <select id="f-dictamen" name="dictamen" defaultValue={filtros.dictamen ?? ""} className={CLASES_SELECT}>
          <option value="">Todos</option>
          {RESULTADOS.map((r) => (
            <option key={r} value={r}>
              {ETIQUETA_RESULTADO[r]}
            </option>
          ))}
          <option value={SIN_DICTAMEN}>Sin dictamen</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="f-servicio">Servicio</Label>
        <select id="f-servicio" name="servicio" defaultValue={filtros.servicio ?? ""} className={CLASES_SELECT}>
          <option value="">Todos</option>
          {SERVICIOS.map((s) => (
            <option key={s} value={s}>
              {ETIQUETA_SERVICIO[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="f-desde">Desde</Label>
        <input
          id="f-desde"
          name="desde"
          type="date"
          defaultValue={filtros.desde ?? ""}
          className={CLASES_SELECT}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="f-hasta">Hasta</Label>
        <input
          id="f-hasta"
          name="hasta"
          type="date"
          defaultValue={filtros.hasta ?? ""}
          className={CLASES_SELECT}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">Filtrar</Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/expedientes" />}>
          Limpiar
        </Button>
      </div>
    </form>
  );
}
