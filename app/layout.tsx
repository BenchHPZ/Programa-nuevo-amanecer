import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Montserrat solo para títulos (docs/MANUAL-IMAGEN.md §4): es la más cercana
 * a «GUANAJUATO» del logotipo. Solo los pesos 600 y 700 — no hace falta más
 * y cada peso extra es descarga que alguien paga con datos de su celular.
 *
 * `Caveat Brush` (la manuscrita) NO se carga a propósito: el manual la
 * restringe a carteles y la prohíbe en formularios y en todo lo que se firma.
 */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Programa Nuevo Amanecer",
  description: "Sistema de gestión de jornadas — Programa Nuevo Amanecer, A.C.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
