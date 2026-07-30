/**
 * Siluetas por defecto de la sección de aliados, para cuando no hay logo.
 *
 * Una por categoría, no una sola genérica para todas — el punto es que la
 * tarjeta siga diciendo algo aunque no haya logo. Mismo criterio que
 * `siluetas.tsx` para personas: SVG en línea, `currentColor`, mismo trazo.
 *
 * Cuál se dibuja lo decide `categoria`, tomada del dato del aliado en
 * `config/contenido-landing.ts` — no hay adivinanza posible aquí, cada
 * aliado ya trae su categoría para agruparse en la landing.
 */

import type { CategoriaAliado } from "@/config/contenido-landing";

import { Marco } from "./siluetas";

/** Edificio con techo a dos aguas: sedes hospitalarias. */
function SiluetaSede() {
  return (
    <Marco>
      <path d="M22 85V38L50 17l28 21v47" />
      <path d="M22 85h56" />
      <path d="M50 40v22M39 51h22" />
    </Marco>
  );
}

/** Fachada de columnas: respaldo institucional/gubernamental. */
function SiluetaInstitucional() {
  return (
    <Marco>
      <path d="M15 40 50 18l35 22" />
      <path d="M18 40h64" />
      <path d="M28 40v37M40 40v37M50 40v37M60 40v37M72 40v37" />
      <path d="M14 85h72" />
    </Marco>
  );
}

/** Cruz sólida de trazo: equipos quirúrgicos. */
function SiluetaQuirurgico() {
  return (
    <Marco>
      <path d="M42 18h16v22h22v16H58v22H42V56H20V40h22z" />
    </Marco>
  );
}

/** Birrete: voluntariado académico y estudiantil. */
function SiluetaAcademico() {
  return (
    <Marco>
      <path d="M10 42 50 24l40 18-40 18z" />
      <path d="M28 48v14c0 8 44 8 44 0V48" />
      <path d="M82 44v20" />
    </Marco>
  );
}

/** Corazón: empresas y benefactores. */
function SiluetaDonante() {
  return (
    <Marco>
      <path d="M50 82C20 60 12 40 25 27c10-10 23-5 25 6 2-11 15-16 25-6 13 13 5 33-25 55Z" />
    </Marco>
  );
}

export function SiluetaAliado({ categoria }: { categoria: CategoriaAliado }) {
  switch (categoria) {
    case "sede":
      return <SiluetaSede />;
    case "institucional":
      return <SiluetaInstitucional />;
    case "quirurgico":
      return <SiluetaQuirurgico />;
    case "academico":
      return <SiluetaAcademico />;
    case "donante":
      return <SiluetaDonante />;
  }
}
