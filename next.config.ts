import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La tarjeta PNG del pase lee estas fuentes e ilustraciones del disco en el servidor.
  outputFileTracingIncludes: {
    "/admin/qr/**": ["./src/app/admin/qr/fuentes/**", "./public/ilustraciones/*.svg"],
  },
};

export default nextConfig;
