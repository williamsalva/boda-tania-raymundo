/* eslint-disable @next/next/no-img-element -- Satori (ImageResponse) solo entiende <img> */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { obtenerAdmin } from "@/lib/admin";
import { EVENTOS, FECHA_TEXTO, NOVIOS } from "@/lib/boda";
import { obtenerFamiliaPorId } from "@/lib/familias";
import { esperadosDe } from "@/lib/pases";
import { urlPase } from "@/lib/sitio";

// Tarjeta "pase de entrada" en PNG para mandar por WhatsApp. Tamaño vertical 4:5.
const ANCHO = 1080;
const ALTO = 1350;

const C = {
  rubor: "#fbf3f6",
  perla: "#fffafc",
  rosa: "#c94a91",
  fucsia: "#c40a78",
  vino: "#9b2548",
  tinta: "#4a1830",
};

// Rutas literales para que el empaquetador solo incluya estos archivos.
const recursos = Promise.all([
  readFile(join(process.cwd(), "src/app/admin/qr/fuentes/PinyonScript-Regular.ttf")),
  readFile(join(process.cwd(), "src/app/admin/qr/fuentes/CormorantGaramond-Medium.ttf")),
  readFile(join(process.cwd(), "src/app/admin/qr/fuentes/CormorantGaramond-Italic.ttf")),
  readFile(join(process.cwd(), "src/app/admin/qr/fuentes/Montserrat-Medium.ttf")),
  readFile(join(process.cwd(), "public/ilustraciones/ramillete_floral.svg")),
  readFile(join(process.cwd(), "public/ilustraciones/divisor_floral.svg")),
]);

const dataSvg = (b: Buffer) => `data:image/svg+xml;base64,${b.toString("base64")}`;

const recepcion = EVENTOS.find((e) => e.titulo === "Recepción");

export async function GET(request: Request, ctx: RouteContext<"/admin/qr/[id]">) {
  if (!(await obtenerAdmin())) return new Response("No autorizado", { status: 401 });

  const { id } = await ctx.params;
  const familia = await obtenerFamiliaPorId(id);
  if (!familia) return new Response("No existe esa familia", { status: 404 });

  const [script, serif, serifItalica, sans, svgRamillete, svgDivisor] = await recursos;
  const ramillete = dataSvg(svgRamillete);
  const divisor = dataSvg(svgDivisor);
  const qr = await QRCode.toDataURL(urlPase(familia.codigo), {
    errorCorrectionLevel: "M",
    margin: 0,
    width: 560,
    color: { dark: C.tinta, light: "#ffffff" },
  });

  const lista = esperadosDe(familia);
  const pases = lista.length;
  const mostrarNombres = pases <= 8;
  const descargar = new URL(request.url).searchParams.has("descargar");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: C.rubor, padding: 44 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            padding: 12,
            background: C.perla,
            border: `2px solid ${C.rosa}55`,
            borderRadius: 28,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              border: `1px solid ${C.rosa}40`,
              borderRadius: 20,
              padding: "26px 56px 40px",
              color: C.tinta,
            }}
          >
            <img alt="" src={ramillete} width={380} height={152} style={{ marginTop: -6 }} />

            <div style={{ fontFamily: "Montserrat", fontSize: 22, letterSpacing: 9, color: C.vino, marginTop: 4 }}>
              PASE DE ENTRADA
            </div>
            <div style={{ fontFamily: "Pinyon", fontSize: 108, color: C.fucsia, lineHeight: 1.05, marginTop: 6 }}>
              {`${NOVIOS.ellaCorto} & ${NOVIOS.elCorto}`}
            </div>
            <div style={{ fontFamily: "Montserrat", fontSize: 24, letterSpacing: 8, color: C.tinta, marginTop: 22 }}>
              {FECHA_TEXTO}
            </div>

            <div
              style={{
                display: "flex",
                padding: 26,
                marginTop: 34,
                background: "#ffffff",
                borderRadius: 22,
                border: `1px solid ${C.rosa}40`,
                boxShadow: "0 18px 40px -24px rgba(155,37,72,0.45)",
              }}
            >
              <img alt="" src={qr} width={440} height={440} />
            </div>

            <div
              style={{
                fontFamily: "Cormorant",
                fontSize: familia.nombre.length > 28 ? 46 : 56,
                color: C.vino,
                marginTop: 34,
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              {familia.nombre}
            </div>
            <div style={{ fontFamily: "Montserrat", fontSize: 22, letterSpacing: 6, color: C.rosa, marginTop: 12 }}>
              {pases === 1 ? "VÁLIDO PARA 1 PERSONA" : `VÁLIDO PARA ${pases} PERSONAS`}
            </div>
            {mostrarNombres && (
              <div
                style={{
                  fontFamily: "Cormorant",
                  fontStyle: "italic",
                  fontSize: 28,
                  color: C.tinta,
                  opacity: 0.8,
                  marginTop: 12,
                  textAlign: "center",
                  lineHeight: 1.3,
                  maxWidth: 820,
                }}
              >
                {lista.join(" · ")}
              </div>
            )}

            <div style={{ flex: 1 }} />
            <img alt="" src={divisor} width={330} height={53} />
            <div style={{ fontFamily: "Montserrat", fontSize: 19, letterSpacing: 4, color: C.tinta, marginTop: 14, opacity: 0.85 }}>
              {recepcion ? `${recepcion.lugar.toUpperCase()} · ${recepcion.hora.toUpperCase()}` : ""}
            </div>
            <div style={{ fontFamily: "Cormorant", fontStyle: "italic", fontSize: 26, color: C.vino, marginTop: 8 }}>
              Presenta este código en la entrada del salón
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: ANCHO,
      height: ALTO,
      fonts: [
        { name: "Pinyon", data: script, weight: 400, style: "normal" },
        { name: "Cormorant", data: serif, weight: 500, style: "normal" },
        { name: "Cormorant", data: serifItalica, weight: 400, style: "italic" },
        { name: "Montserrat", data: sans, weight: 500, style: "normal" },
      ],
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `${descargar ? "attachment" : "inline"}; filename="pase-${familia.slug}.png"`,
      },
    },
  );
}
