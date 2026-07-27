"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Reconocimiento } from "@/config/contenido-landing";
import { Button } from "@/components/ui/button";

import { Silueta } from "./siluetas";

/**
 * Salón de la fama: reconocimiento permanente a quien sostiene el programa.
 *
 * El desplazamiento es `scroll-snap` de CSS, no una librería de carrusel:
 *
 * · El arrastre táctil en celular lo resuelve el navegador, y mejor.
 * · Todas las tarjetas están siempre en el DOM, así que la búsqueda del
 *   navegador (Ctrl+F) las encuentra y un lector de pantalla las lee como la
 *   lista que son. Un carrusel que oculta diapositivas rompe las dos cosas.
 * · Los botones son una comodidad para ratón; sin JavaScript la sección
 *   sigue siendo utilizable, solo que desplazándola a mano.
 *
 * Quien desborda horizontalmente es este contenedor, nunca la página.
 */
export function SalonDeLaFama({ personas }: { personas: Reconocimiento[] }) {
  const pista = useRef<HTMLUListElement>(null);
  const [puedeIzquierda, setPuedeIzquierda] = useState(false);
  const [puedeDerecha, setPuedeDerecha] = useState(false);

  const revisarBordes = useCallback(() => {
    const el = pista.current;
    if (!el) return;
    // 1px de holgura: los navegadores redondean scrollLeft y sin esto el
    // botón derecho se queda visible aunque ya no haya a dónde ir.
    setPuedeIzquierda(el.scrollLeft > 1);
    setPuedeDerecha(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    revisarBordes();
    const el = pista.current;
    if (!el) return;

    el.addEventListener("scroll", revisarBordes, { passive: true });
    // Al cambiar el ancho de la ventana puede dejar de haber desbordamiento.
    const observador = new ResizeObserver(revisarBordes);
    observador.observe(el);

    return () => {
      el.removeEventListener("scroll", revisarBordes);
      observador.disconnect();
    };
  }, [revisarBordes]);

  function desplazar(direccion: -1 | 1) {
    const el = pista.current;
    if (!el) return;
    // Se avanza casi una pantalla, dejando un poco a la vista para no perder
    // el hilo de dónde se iba.
    //
    // Desplazamiento instantáneo, sin animación, y es deliberado.
    //
    // Medido en el navegador: pedir scroll suave —con `behavior: "smooth"` o
    // con `scroll-behavior: smooth` en CSS, da igual— dejaba la pista clavada
    // en 0. El desplazamiento normal sí funciona. Puede que sea cosa del
    // navegador de pruebas y que en uno de escritorio se anime bien, pero no
    // pienso apostar el funcionamiento del botón a una animación que no puedo
    // comprobar: si falla, el botón no hace nada y la última tarjeta queda
    // inalcanzable. Un salto instantáneo funciona en todos lados, y es además
    // lo que reciben quienes piden movimiento reducido.
    el.scrollBy({ left: direccion * el.clientWidth * 0.85 });

    // Se recalculan los bordes aquí mismo y de forma síncrona, sin esperar al
    // evento `scroll` ni a un `requestAnimationFrame`.
    //
    // Medido en el navegador: hay entornos que no emiten `scroll` para
    // desplazamientos programáticos y que además no ejecutan `rAF`. Con
    // cualquiera de las dos vías, los botones se quedaban con el estado
    // anterior: el de «anteriores» seguía deshabilitado al llegar al final,
    // así que no había manera de volver. Como el desplazamiento es
    // instantáneo, `scrollLeft` ya está actualizado en esta misma línea.
    //
    // El oyente de `scroll` de abajo sigue haciendo falta para cuando la
    // persona arrastra con el dedo o el trackpad.
    revisarBordes();
  }

  return (
    <div className="space-y-4">
      <ul
        ref={pista}
        // `snap-proximity` y NO `snap-mandatory`, que es lo que aparece en
        // todos los ejemplos: con pocas tarjetas, el desplazamiento total
        // puede ser menor que el ancho de una, y entonces el único punto de
        // anclaje alcanzable es el 0. Mandatory obliga a anclar y al arrastrar
        // devuelve la pista al inicio, dejando la última tarjeta inalcanzable.
        // Proximity ancla solo cuando ya estás cerca de un punto.
        //
        // Sin `scroll-smooth`: ver el porqué en `desplazar()`.
        className="flex snap-x snap-proximity gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]"
      >
        {personas.map((persona) => (
          <li
            key={persona.nombre}
            className="flex w-64 shrink-0 snap-start flex-col items-center gap-3 rounded-lg border bg-card p-5 text-center"
          >
            <div className="h-24 w-24 overflow-hidden rounded-full border bg-accent text-accent-foreground">
              {persona.foto ? (
                <Image
                  src={persona.foto}
                  alt={persona.nombre}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="p-3">
                  <Silueta tipo={persona.silueta} />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="font-medium leading-tight">{persona.nombre}</p>
              <p className="text-sm text-muted-foreground">{persona.papel}</p>
              {persona.institucion ? (
                <p className="text-xs text-muted-foreground">{persona.institucion}</p>
              ) : null}
            </div>

            {persona.desde ? (
              <p className="mt-auto text-xs font-medium tabular-nums text-primary">
                {persona.desde}
              </p>
            ) : null}

            {persona.enlace ? (
              <a
                href={persona.enlace.url}
                target="_blank"
                // noopener evita que la página destino acceda a window.opener;
                // noreferrer, que reciba de dónde viene el clic.
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs underline"
              >
                {persona.enlace.etiqueta}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : null}
          </li>
        ))}
      </ul>

      {(puedeIzquierda || puedeDerecha) && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => desplazar(-1)}
            disabled={!puedeIzquierda}
            aria-label="Ver anteriores"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => desplazar(1)}
            disabled={!puedeDerecha}
            aria-label="Ver siguientes"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
