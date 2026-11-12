/** URL pública del sitio: la de producción en Vercel, o localhost en desarrollo. */
export const SITIO =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/** Lo que va dentro del QR: abre la ficha de la familia en la app de la entrada. */
export const urlPase = (codigo: string) => `${SITIO}/entrada/${codigo}`;
