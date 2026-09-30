import Image, { type StaticImageData } from "next/image";
import botones from "../../public/flores/botones.png";
import flor from "../../public/flores/flor.png";
import amarilla from "../../public/flores/sueltas/amarilla.png";
import durazno from "../../public/flores/sueltas/durazno.png";
import rosa from "../../public/flores/sueltas/rosa.png";
import tulipan from "../../public/flores/sueltas/tulipan.png";
import type { CSSProperties } from "react";
import { NOVIOS } from "@/lib/boda";
import { Esquinas } from "./Ornamentos";
import { Revelar } from "./Revelar";

// Collage tipo "flatlay": polaroids repartidas y encimadas sobre la mesa, con flores sueltas,
// que caen en su lugar al hacer scroll. Coordenadas en % del ancho del collage (cqw): [x, y, ancho, giro].
// `cel` es la distribución en celular y `pc` en pantallas medianas en adelante.
type Pos = [number, number, number, number];

const FOTOS: { src: string; horizontal: boolean; cel: Pos; pc: Pos; cinta?: number }[] = [
  { src: "/fotos/01.jpg", horizontal: false, cel: [1, 0, 56, -5], pc: [3, 5, 20, -6], cinta: -8 },
  { src: "/fotos/08.jpg", horizontal: true, cel: [44, 20, 54, 6], pc: [21, 21, 26, 4] },
  { src: "/fotos/02.jpg", horizontal: false, cel: [0, 138, 52, 4], pc: [58, 13, 19, 5], cinta: 6 },
  { src: "/fotos/05.jpg", horizontal: true, cel: [46, 162, 52, -6], pc: [76, 19, 22, -5] },
  { src: "/fotos/10.jpg", horizontal: false, cel: [22, 212, 56, 3], pc: [42, 31, 16, -3], cinta: 10 },
];

// La tarjeta "Nuestra historia" al centro del collage.
const TARJETA: { cel: Pos; pc: Pos } = { cel: [18, 72, 60, -3], pc: [41, 3, 19, -2] };

const ALTO = { cel: 294, pc: 55 };

function posicion({ cel, pc }: { cel: Pos; pc: Pos }): CSSProperties {
  const [x, y, w, r] = cel;
  const [dx, dy, dw, dr] = pc;
  return {
    "--x": x, "--y": y, "--w": w, "--r": `${r}deg`,
    "--dx": dx, "--dy": dy, "--dw": dw, "--dr": `${dr}deg`,
  } as CSSProperties;
}

const COLOCAR =
  "absolute left-[calc(var(--x)*1cqw)] top-[calc(var(--y)*1cqw)] w-[calc(var(--w)*1cqw)] [--giro:var(--r)] " +
  "md:left-[calc(var(--dx)*1cqw)] md:top-[calc(var(--dy)*1cqw)] md:w-[calc(var(--dw)*1cqw)] md:[--giro:var(--dr)] " +
  "hover:z-30";

function Cinta({ giro }: { giro: number }) {
  return (
    <span
      aria-hidden
      className="absolute left-1/2 -top-3 z-10 h-6 w-[38%] bg-rosa/30 shadow-sm"
      style={{
        transform: `translateX(-50%) rotate(${giro}deg)`,
        // orillas dentadas como cinta cortada a mano
        clipPath:
          "polygon(0 8%, 4% 0, 8% 10%, 12% 0, 88% 0, 92% 10%, 96% 0, 100% 8%, 100% 92%, 96% 100%, 92% 90%, 88% 100%, 12% 100%, 8% 90%, 4% 100%, 0 92%)",
      }}
    />
  );
}

// Flores de acuarela sueltas sobre la mesa, recortadas del mismo marco floral.
// [imagen, x %, y % del alto, ancho px, giro, retraso de flotado s]
const SUELTAS: [StaticImageData, number, number, number, number, number][] = [
  [durazno, 4, 26, 64, -20, 0],
  [botones, 80, 3, 86, 25, 1.2],
  [tulipan, 1, 50, 40, 35, 0.6],
  [amarilla, 85, 44, 56, -15, 2],
  [rosa, 60, 93, 50, 20, 1.6],
  [flor, 3, 94, 54, 15, 0.3],
  [tulipan, 90, 86, 38, -40, 2.4],
  [amarilla, 36, 47, 34, 60, 1],
];

function FloresSueltas() {
  return SUELTAS.map(([src, x, y, ancho, giro, retraso], i) => (
    <span
      key={i}
      aria-hidden
      className="pointer-events-none absolute drop-shadow-[0_6px_6px_rgba(155,37,72,0.18)]"
      style={{ left: `${x}%`, top: `${y}%`, width: ancho, rotate: `${giro}deg`, animation: `flotar 6s ease-in-out ${retraso}s infinite` }}
    >
      <Image src={src} alt="" sizes="90px" className="h-auto w-full" />
    </span>
  ));
}

export function Galeria() {
  return (
    <div className="@container mx-auto max-w-md md:max-w-5xl">
      <div
        className="collage relative h-[calc(var(--alto-cel)*1cqw)] md:h-[calc(var(--alto-pc)*1cqw)]"
        style={{ "--alto-cel": ALTO.cel, "--alto-pc": ALTO.pc } as CSSProperties}
      >
        <FloresSueltas />

        <Revelar className={COLOCAR} style={posicion(TARJETA)} retraso={150}>
          <div className="polaroid-entrada tarjeta overflow-hidden aspect-[4/5] flex flex-col items-center justify-center px-4 text-center">
            <Esquinas cuales={["sup-izq", "inf-der"]} tam="w-[42%]" />
            <p className="font-script text-[calc(var(--w)*0.2cqw)] md:text-[calc(var(--dw)*0.2cqw)] leading-none text-vino">
              Nuestra
            </p>
            <p className="font-serif uppercase tracking-[0.2em] text-[calc(var(--w)*0.09cqw)] md:text-[calc(var(--dw)*0.09cqw)] text-vino">
              historia
            </p>
          </div>
        </Revelar>

        {FOTOS.map((foto, i) => (
          <Revelar key={foto.src} className={COLOCAR} style={posicion(foto)} retraso={(i % 2) * 150}>
            <figure className="polaroid-entrada relative bg-[#f7f5f1] p-[3.5%] pb-[16%] shadow-[0_18px_35px_-16px_rgba(74,24,48,0.5),0_2px_6px_rgba(74,24,48,0.08)]">
              {foto.cinta !== undefined && <Cinta giro={foto.cinta} />}
              <div className={`relative overflow-hidden ${foto.horizontal ? "aspect-[5/4]" : "aspect-[4/5]"}`}>
                <Image
                  src={foto.src}
                  alt={`${NOVIOS.ellaCorto} y ${NOVIOS.elCorto} — foto ${i + 1}`}
                  fill
                  sizes="(min-width: 768px) 280px, 60vw"
                  className="object-cover"
                />
              </div>
            </figure>
          </Revelar>
        ))}
      </div>
    </div>
  );
}
