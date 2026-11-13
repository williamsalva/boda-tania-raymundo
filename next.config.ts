import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La tarjeta PNG del pase lee estas fuentes y flores de acuarela del disco en el servidor.
  outputFileTracingIncludes: {
    "/admin/qr/**": ["./src/app/admin/qr/fuentes/**", "./public/flores/*.png"],
  },
};

export default nextConfig;
