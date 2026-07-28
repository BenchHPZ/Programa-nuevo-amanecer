import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  obtenerConteosPublicos,
  obtenerJornadaActivaPublica,
  obtenerJornadaParaConvocatoria,
} from "@/lib/jornada";

const ETIQUETA_ETAPA: Record<"etapa1" | "etapa2", string> = {
  etapa1: "Etapa 1 — en curso",
  etapa2: "Etapa 2 — en curso",
};

function formatearFecha(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { dateStyle: "long" });
}

/** Diferencia en días de calendario contra hoy, sin horas de por medio. */
function diasRestantes(fecha: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = new Date(`${fecha}T00:00:00`);
  return Math.round((objetivo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

type JornadaActiva = NonNullable<Awaited<ReturnType<typeof obtenerJornadaActivaPublica>>>;
type Conteos = Awaited<ReturnType<typeof obtenerConteosPublicos>>;
type ProximaJornada = Awaited<ReturnType<typeof obtenerJornadaParaConvocatoria>>;

/**
 * RF-170/171 (ampliación). Dos bloques independientes, no uno solo:
 * "próxima jornada" siempre puede tener algo que decir (o su mensaje de
 * respaldo), mientras que el de jornada activa solo aparece cuando de
 * verdad hay una corriendo — ver lib/jornada.ts para por qué ya no se
 * pisan entre sí.
 */
export function BannerJornada({
  jornadaActiva,
  conteos,
  proximaJornada,
}: {
  jornadaActiva: JornadaActiva | null;
  conteos: Conteos | null;
  proximaJornada: ProximaJornada | null;
}) {
  const etapa = jornadaActiva?.estado === "etapa1" || jornadaActiva?.estado === "etapa2" ? jornadaActiva.estado : null;

  return (
    <div className="space-y-4">
      {jornadaActiva && etapa && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {jornadaActiva.nombre}
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {ETIQUETA_ETAPA[etapa]}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{jornadaActiva.sede}</p>

            {etapa === "etapa1" && jornadaActiva.fecha_etapa2 && (
              <p className="text-sm text-muted-foreground">
                La etapa 2 (cirugías y láser) comienza el {formatearFecha(jornadaActiva.fecha_etapa2)}
                {diasRestantes(jornadaActiva.fecha_etapa2) > 0 &&
                  ` — faltan ${diasRestantes(jornadaActiva.fecha_etapa2)} día(s).`}
              </p>
            )}

            {conteos && (
              <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
                <Cifra valor={conteos.registrados_hoy ?? 0} etiqueta="Registrados hoy" />
                <Cifra valor={conteos.total_expedientes ?? 0} etiqueta="Pacientes registrados" />
                <Cifra valor={conteos.completos ?? 0} etiqueta="Expedientes completos" />
                <Cifra valor={conteos.dictaminados ?? 0} etiqueta="Ya dictaminados" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>Próxima jornada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {proximaJornada ? (
            <>
              <p className="text-lg font-medium">{proximaJornada.nombre}</p>
              <p className="text-muted-foreground">{proximaJornada.sede}</p>
              <p className="text-muted-foreground">
                {formatearFecha(proximaJornada.fecha_inicio_etapa1)} al{" "}
                {formatearFecha(proximaJornada.fecha_fin_etapa1)}
              </p>
              <p className="text-sm text-muted-foreground">
                La atención es gratuita. No se necesita pertenecer a ninguna institución ni contar
                con seguro médico.
              </p>
              <Button nativeButton={false} render={<Link href="/pre-registro" />}>
                Pre-registrar a un paciente
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">
              Todavía no hay fecha anunciada para la próxima jornada. Déjenos sus datos en el
              pre-registro y le avisamos en cuanto se confirme.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Cifra({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-semibold tabular-nums text-primary">{valor}</p>
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
    </div>
  );
}
