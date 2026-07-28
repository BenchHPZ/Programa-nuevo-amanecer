import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next.js 16 exige declarar las calidades que se van a pedir con
    // next/image. components/marca/logo.tsx pide quality={90} (el logotipo
    // es un raster de ~650px; 75 lo veía borroso). Sin esto, el build
    // funciona pero cada request al logo dispara una advertencia — y en un
    // futuro major podría ser un error duro.
    qualities: [75, 90],
  },
};

export default nextConfig;
