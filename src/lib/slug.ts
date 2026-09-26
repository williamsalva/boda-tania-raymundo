/** Rutas propias de la app que no pueden usarse como enlace de familia. */
export const SLUGS_RESERVADOS = new Set(["admin", "api", "_next", "favicon-ico"]);

/** "Familia Alba García" / "familia%20alba" / "FAMILIA-ALBA" → "familia-alba-garcia" */
export function normalizarSlug(valor: string) {
  let texto = valor;
  try {
    texto = decodeURIComponent(valor);
  } catch {}
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
