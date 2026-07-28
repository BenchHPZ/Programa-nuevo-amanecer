import Link from "next/link";

import {
  ALIADOS_INSTITUCIONALES,
  CIFRAS,
  CONTACTO,
  DONANTES,
  ETIQUETA_CATEGORIA,
  HITOS,
  ORGANIZACION,
  PASOS,
  PREGUNTAS_FRECUENTES,
  SALON_DE_LA_FAMA,
  SERVICIOS,
  faltaConfirmar,
  type CategoriaAliado,
} from "@/config/contenido-landing";
import {
  obtenerConteosPublicos,
  obtenerJornadaActivaPublica,
  obtenerJornadaParaConvocatoria,
} from "@/lib/jornada";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/marca/logo";
import { SalonDeLaFama } from "@/components/landing/salon-de-la-fama";
import { BannerJornada } from "@/components/landing/banner-jornada";

export const dynamic = "force-dynamic";

/**
 * Landing pública (RF-170 a RF-173).
 *
 * El contenido institucional sale de config/contenido-landing.ts, no de aquí:
 * los datos de contacto están sin confirmar y los nombres de donantes pueden
 * tener que quitarse. Ver ese archivo para el porqué.
 *
 * Sin fotografías de pacientes: docs/MANUAL-IMAGEN.md §5 las prohíbe sin
 * consentimiento escrito específico para difusión, y no existe.
 */
export default async function Inicio() {
  const [proximaJornada, jornadaActiva] = await Promise.all([
    obtenerJornadaParaConvocatoria(),
    obtenerJornadaActivaPublica(),
  ]);
  const conteos = jornadaActiva ? await obtenerConteosPublicos(jornadaActiva.id) : null;

  // Los aliados se agrupan por categoría: con once instituciones, una lista
  // plana es un muro que nadie lee.
  const aliadosPorCategoria = ALIADOS_INSTITUCIONALES.reduce<
    Record<string, typeof ALIADOS_INSTITUCIONALES>
  >((acc, aliado) => {
    (acc[aliado.categoria] ??= []).push(aliado);
    return acc;
  }, {});

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
        {/* Logo a color, arriba a la izquierda, ≥180 px (manual §6). */}
        <Logo ancho={200} prioridad />
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/colaborar" className="text-muted-foreground hover:text-foreground">
            Quiero colaborar
          </Link>
          <Link href="/auth/iniciar-sesion" className="text-muted-foreground hover:text-foreground">
            Iniciar sesión
          </Link>
        </nav>
      </header>

      {/* ── Portada ── */}
      <section className="border-b bg-muted/40 px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Provocar la sonrisa
          </h1>
          <p className="text-lg text-muted-foreground">
            Desde 1984, un equipo que dona su tiempo para operar, sin costo alguno, a niñas y
            niños con labio y/o paladar hendido.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/pre-registro" />}>
              Pre-registrar a un paciente
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/colaborar" />}
            >
              Quiero colaborar
            </Button>
          </div>
        </div>
      </section>

      {/* ── Cifras ── */}
      <section className="border-b px-6 py-12">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CIFRAS.map((c) => (
            <div key={c.detalle} className="text-center">
              <p className="text-3xl font-semibold tabular-nums text-primary">{c.valor}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.detalle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Banner de jornada ── */}
      <section className="mx-auto w-full max-w-4xl px-6 py-12">
        <BannerJornada jornadaActiva={jornadaActiva} conteos={conteos} proximaJornada={proximaJornada} />
      </section>

      {/* ── Cómo funciona ── */}
      <section className="border-t bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Cómo funciona la jornada</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {PASOS.map((p) => (
              <Card key={p.titulo}>
                <CardHeader>
                  <CardTitle className="text-base">{p.titulo}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{p.texto}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preguntas frecuentes ──
          <details> nativo: se abre sin JavaScript y el navegador ya le da
          semántica, teclado y búsqueda en página. */}
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Preguntas frecuentes</h2>
        <div className="divide-y rounded-lg border">
          {PREGUNTAS_FRECUENTES.map((f) => (
            <details key={f.pregunta} className="group px-4">
              <summary className="cursor-pointer list-none py-4 font-medium marker:content-none">
                <span className="flex items-start justify-between gap-4">
                  {f.pregunta}
                  <span
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="pb-4 text-sm text-muted-foreground">{f.respuesta}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Qué se atiende ── */}
      <section className="border-t bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Qué se atiende</h2>
          <ul className="grid list-inside list-disc gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {SERVICIOS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Qué procedimiento corresponde a cada paciente, y cuándo, lo determina el equipo
            médico durante la valoración.
          </p>
        </div>
      </section>

      {/* ── Salón de la fama ── */}
      <section className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Salón de la fama</h2>
          <p className="text-muted-foreground">
            Cerca de treinta especialistas se suman a cada jornada y ninguno cobra honorarios.
            Esta es nuestra forma de dejar constancia, de manera permanente, de quienes hacen
            posible el programa.
          </p>
        </div>
        <SalonDeLaFama personas={SALON_DE_LA_FAMA} />
      </section>

      {/* ── Línea de tiempo ── */}
      <section className="border-t bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Cuarenta años de jornadas</h2>
          <ol className="relative space-y-6 border-l pl-6">
            {HITOS.map((h) => (
              <li key={h.anio} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary"
                />
                <p className="text-sm font-semibold tabular-nums text-primary">{h.anio}</p>
                <p className="font-medium">{h.titulo}</p>
                <p className="text-sm text-muted-foreground">{h.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Quiénes somos y aliados ── */}
      <section className="mx-auto w-full max-w-4xl space-y-8 px-6 py-12">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Quiénes somos</h2>
          <p className="text-sm text-muted-foreground">
            {ORGANIZACION.nombreLegal} nació en {ORGANIZACION.fundacion} en la Clínica Hospital
            del ISSSTE de Guanajuato, que fue su sede durante cuarenta años. La primera campaña
            atendió a cinco pacientes; hoy son alrededor de doscientos al año, repartidos en dos
            jornadas.
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Quién lo hace posible</h3>
          {(Object.keys(aliadosPorCategoria) as CategoriaAliado[]).map((categoria) => (
            <div key={categoria} className="space-y-2">
              <p className="text-sm font-medium">{ETIQUETA_CATEGORIA[categoria]}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {aliadosPorCategoria[categoria].map((a) => (
                  <div key={a.nombre} className="rounded-md border p-3">
                    <p className="text-sm font-medium">{a.nombre}</p>
                    <p className="text-xs text-muted-foreground">{a.aporte}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {DONANTES.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Empresas y benefactores</p>
              <p className="text-sm text-muted-foreground">{DONANTES.join(" · ")}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Contacto ── */}
      <section className="border-t bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-4xl space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Contacto</h2>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Correo: </span>
              {CONTACTO.correo}
            </p>
            <p>
              <span className="text-muted-foreground">Teléfono: </span>
              {CONTACTO.telefono}
            </p>
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">Domicilio: </span>
              {CONTACTO.domicilio}
            </p>
          </div>
          {faltaConfirmar(CONTACTO.correo) && (
            <p className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
              Los datos de contacto están pendientes de confirmar con la asociación. Esta página
              no debe publicarse hasta completarlos.
            </p>
          )}
        </div>
      </section>

      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            {ORGANIZACION.nombreLegal} · {ORGANIZACION.fundacion}
          </p>
          <div className="flex gap-4">
            <Link href="/aviso-de-privacidad" className="underline">
              Aviso de privacidad
            </Link>
            <Link href="/colaborar" className="underline">
              Colaborar
            </Link>
            <Link href="/pre-registro" className="underline">
              Pre-registro
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
