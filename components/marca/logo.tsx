import Image from "next/image";

/**
 * Logotipo institucional. Reglas de uso en docs/MANUAL-IMAGEN.md §2 y §6.
 *
 * Tres cosas que el manual marca y que este componente respeta por omisión:
 *
 * · **180 px de ancho mínimo** en pantalla. Por debajo, «GUANAJUATO» se
 *   cierra y el logotipo se ve sucio. Para tamaños menores existe la
 *   variante `sol`, que es la reducida.
 * · **Fondo oscuro usa otro archivo**, con ambos colores aclarados. No es
 *   capricho: los de fondo claro se apagan sobre oscuro (§3).
 * · **Sobre fotografía va monocromo blanco**, nunca la versión a color.
 *
 * No lleva logo en las pantallas de captura y dictamen: son para trabajar y
 * la marca estorba (§6).
 */

const VARIANTES = {
  /** Uso preferente: blanco o fondos muy claros y neutros. */
  color: { archivo: "/marca/logo-color.png", ancho: 644, alto: 481 },
  /** Obligatoria sobre negro o tonos oscuros. */
  oscuro: { archivo: "/marca/logo-oscuro.png", ancho: 661, alto: 485 },
  /** Una tinta: fotocopia, sellos, documentos que se imprimen en láser B/N. */
  negro: { archivo: "/marca/logo-negro.png", ancho: 644, alto: 481 },
  /** Calado sobre fotografía o color sólido. */
  blanco: { archivo: "/marca/logo-blanco.png", ancho: 644, alto: 481 },
  /** Reducida: solo el sol, para menos de 180 px. Ver §7. */
  sol: { archivo: "/marca/logo-sol.png", ancho: 644, alto: 337 },
} as const;

export type VarianteLogo = keyof typeof VARIANTES;

export function Logo({
  variante = "color",
  ancho = 200,
  className,
  prioridad,
}: {
  variante?: VarianteLogo;
  /** Ancho en píxeles. El lockup completo no baja de 180 (§2). */
  ancho?: number;
  className?: string;
  prioridad?: boolean;
}) {
  const { archivo, ancho: anchoNativo, alto: altoNativo } = VARIANTES[variante];

  return (
    <Image
      src={archivo}
      alt="Programa Nuevo Amanecer, Guanajuato"
      width={ancho}
      height={Math.round((ancho * altoNativo) / anchoNativo)}
      className={className}
      priority={prioridad}
      // El original es un raster de ~650 px: pedirle a next/image que genere
      // versiones mayores solo lo emborronaría. Falta el vectorial (§7).
      quality={90}
    />
  );
}
