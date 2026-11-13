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

// Tarjeta "pase de entrada" en PNG para mandar por WhatsApp. Tamaño vertical 4:5,
// con las mismas flores de acuarela y rayas rosas de la invitación.
const ANCHO = 1080;
const ALTO = 1350;

const C = {
  raya: "#f3e4ec",
  fondo: "#fdf8fa",
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
  readFile(join(process.cwd(), "public/flores/esquina-sup-izq.png")),
  readFile(join(process.cwd(), "public/flores/esquina-sup-der.png")),
  readFile(join(process.cwd(), "public/flores/esquina-inf-izq.png")),
  readFile(join(process.cwd(), "public/flores/esquina-inf-der.png")),
  readFile(join(process.cwd(), "public/flores/flor.png")),
]);

const dataPng = (b: Buffer) => `data:image/png;base64,${b.toString("base64")}`;

const recepcion = EVENTOS.find((e) => e.titulo === "Recepción");

/** Línea fina con una florecita de acuarela al centro. */
function Separador({ flor, ancho = 420 }: { flor: string; ancho?: number }) {
  const linea = { display: "flex", width: (ancho - 70) / 2, height: 1.5, background: `${C.rosa}55` };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={linea} />
      <img alt="" src={flor} width={42} height={35} />
      <div style={linea} />
    </div>
  );
}

export async function GET(request: Request, ctx: RouteContext<"/admin/qr/[id]">) {
  if (!(await obtenerAdmin())) return new Response("No autorizado", { status: 401 });

  const { id } = await ctx.params;
  const familia = await obtenerFamiliaPorId(id);
  if (!familia) return new Response("No existe esa familia", { status: 404 });

  const [script, serif, serifItalica, sans, ...pngs] = await recursos;
  const [supIzq, supDer, infIzq, infDer, flor] = pngs.map(dataPng);
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
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 48,
          backgroundColor: C.fondo,
          backgroundImage: `repeating-linear-gradient(90deg, ${C.raya} 0px, ${C.raya} 22px, ${C.fondo} 22px, ${C.fondo} 44px)`,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            position: "relative",
            background: C.perla,
            border: `2px solid ${C.rosa}40`,
            boxShadow: "0 30px 60px -30px rgba(155,37,72,0.35)",
            overflow: "hidden",
          }}
        >
          {/* Ramos de acuarela en las esquinas, como en la invitación */}
          <img alt="" src={supIzq} width={300} height={428} style={{ position: "absolute", left: -6, top: -6 }} />
          <img alt="" src={supDer} width={280} height={459} style={{ position: "absolute", right: -6, top: -6 }} />
          <img alt="" src={infIzq} width={240} height={395} style={{ position: "absolute", left: -6, bottom: -6 }} />
          <img alt="" src={infDer} width={270} height={365} style={{ position: "absolute", right: -6, bottom: -6 }} />

          {/* Filete interior */}
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 14,
              right: 14,
              bottom: 14,
              display: "flex",
              border: `1px solid ${C.rosa}30`,
            }}
          />

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "70px 150px 56px",
              color: C.tinta,
            }}
          >
            <div style={{ fontFamily: "Montserrat", fontSize: 21, letterSpacing: 10, color: C.vino }}>PASE DE ENTRADA</div>
            <div style={{ fontFamily: "Pinyon", fontSize: 96, color: C.fucsia, lineHeight: 1.05, marginTop: 14 }}>
              {NOVIOS.ellaCorto}
            </div>
            <div style={{ fontFamily: "Cormorant", fontStyle: "italic", fontSize: 54, color: C.rosa, lineHeight: 0.9, marginTop: -2 }}>&amp;</div>
            <div style={{ fontFamily: "Pinyon", fontSize: 96, color: C.fucsia, lineHeight: 1.05, marginTop: -4 }}>
              {NOVIOS.elCorto}
            </div>
            <div style={{ display: "flex", marginTop: 26 }}>
              <Separador flor={flor} ancho={380} />
            </div>
            <div style={{ fontFamily: "Montserrat", fontSize: 23, letterSpacing: 8, color: C.tinta, marginTop: 14 }}>
              {FECHA_TEXTO}
            </div>

            <div
              style={{
                display: "flex",
                padding: 24,
                marginTop: 30,
                background: "#ffffff",
                borderRadius: 18,
                border: `1.5px solid ${C.rosa}45`,
                boxShadow: "0 22px 44px -24px rgba(155,37,72,0.5)",
              }}
            >
              <img alt="" src={qr} width={400} height={400} />
            </div>

            <div
              style={{
                fontFamily: "Cormorant",
                fontSize: familia.nombre.length > 28 ? 44 : 54,
                color: C.vino,
                marginTop: 30,
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              {familia.nombre}
            </div>
            <div style={{ fontFamily: "Montserrat", fontSize: 20, letterSpacing: 6, color: C.rosa, marginTop: 12 }}>
              {pases === 1 ? "VÁLIDO PARA 1 PERSONA" : `VÁLIDO PARA ${pases} PERSONAS`}
            </div>
            {mostrarNombres && (
              <div
                style={{
                  fontFamily: "Cormorant",
                  fontStyle: "italic",
                  fontSize: 27,
                  color: C.tinta,
                  opacity: 0.8,
                  marginTop: 10,
                  textAlign: "center",
                  lineHeight: 1.3,
                  maxWidth: 680,
                }}
              >
                {lista.join(" · ")}
              </div>
            )}

            <div style={{ flex: 1 }} />
            <div style={{ fontFamily: "Montserrat", fontSize: 18, letterSpacing: 4, color: C.tinta, opacity: 0.85 }}>
              {recepcion ? `${recepcion.lugar.toUpperCase()} · ${recepcion.hora.toUpperCase()}` : ""}
            </div>
            <div style={{ fontFamily: "Cormorant", fontStyle: "italic", fontSize: 26, color: C.vino, marginTop: 6 }}>
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
