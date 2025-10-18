// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Permitir imágenes remotas (Supabase Storage)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      // Opcional: si llegas a servir imágenes locales en dev
      // { protocol: "http", hostname: "localhost" },
    ],
  },

  // Opcional: deja compilar aunque haya warnings/errores de ESLint
  // (útil para desplegar en Vercel mientras sigues puliendo reglas)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
