/**
 * Siluetas por defecto del salón de la fama, para cuando no hay fotografía.
 *
 * Van como SVG en línea y no como archivos en `public/`: son dos formas
 * simples, se versionan junto al código y no gastan una petición extra en el
 * primer render de la página.
 *
 * Usan `currentColor`, así que heredan el color del contenedor y responden
 * solas al modo oscuro sin duplicar assets.
 *
 * Cuál se dibuja lo dice el campo `silueta` de cada persona en
 * `config/contenido-landing.ts` — **nunca se deduce del nombre**.
 */

/** Exportado para que components/landing/siluetas-aliado.tsx reuse el mismo envoltorio. */
export function Marco({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * Se distingue por los hombros, más anchos.
 *
 * No lleva trazo de cabello: el que tenía quedaba **por dentro** del círculo
 * de la cabeza y no dibujaba nada — comprobado rasterizando el SVG. Un trazo
 * invisible solo estorba al leer el código.
 */
export function SiluetaMasculina() {
  return (
    <Marco>
      <circle cx="50" cy="33" r="17" />
      <path d="M17 90c0-17 15-27 33-27s33 10 33 27" />
    </Marco>
  );
}

/** Cabello que enmarca el rostro por los dos lados, y hombros más estrechos. */
export function SiluetaFemenina() {
  return (
    <Marco>
      <circle cx="50" cy="34" r="16" />
      <path d="M32 34a18 18 0 0 1 36 0" />
      <path d="M32 34c0 9-2 14-5 20" />
      <path d="M68 34c0 9 2 14 5 20" />
      <path d="M25 90c0-15 11-24 25-24s25 9 25 24" />
    </Marco>
  );
}

export function Silueta({ tipo }: { tipo: "femenina" | "masculina" }) {
  return tipo === "femenina" ? <SiluetaFemenina /> : <SiluetaMasculina />;
}
