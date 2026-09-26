import { tocarBaseDeDatos } from "@/lib/familias";

/**
 * Cron de Vercel cada 5 días (vercel.json) para que el proyecto gratis de Supabase
 * no se pause por inactividad. Si defines CRON_SECRET en Vercel, Vercel lo manda
 * como "Authorization: Bearer …" y aquí se exige; sin él, la ruta solo cuenta filas.
 */
export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (secreto && request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  try {
    const resultado = await tocarBaseDeDatos();
    return Response.json({ ok: true, ...resultado, fecha: new Date().toISOString() });
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
