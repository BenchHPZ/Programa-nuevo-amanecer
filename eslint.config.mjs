import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores de eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generado por el CLI de Supabase (supabase start/stop) — ya ignorado
    // por git (.gitignore), pero ESLint no lee .gitignore por sí solo.
    // Sin esto, el runtime de edge functions embebido (minificado, una sola
    // línea) se lintea como si fuera código propio.
    "supabase/.temp/**",
    "supabase/.branches/**",
  ]),
]);

export default eslintConfig;
