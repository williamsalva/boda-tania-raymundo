import Image from "next/image";
import infDer from "../../public/flores/esquina-inf-der.png";
import infIzq from "../../public/flores/esquina-inf-izq.png";
import supDer from "../../public/flores/esquina-sup-der.png";
import supIzq from "../../public/flores/esquina-sup-izq.png";

// Flores de acuarela recortadas del marco floral que eligió Tania.

const ESQUINAS = {
  "sup-izq": { src: supIzq, pos: "left-0 top-0" },
  "sup-der": { src: supDer, pos: "right-0 top-0" },
  "inf-izq": { src: infIzq, pos: "left-0 bottom-0" },
  "inf-der": { src: infDer, pos: "right-0 bottom-0" },
} as const;

type Esquina = keyof typeof ESQUINAS;

/**
 * Ramos de acuarela en las esquinas del contenedor (que debe ser `relative`).
 * `tam` controla el ancho de cada ramo.
 */
export function Esquinas({
  cuales = ["sup-izq", "sup-der", "inf-izq", "inf-der"],
  tam = "w-[38vw] max-w-[300px]",
  className = "",
}: {
  cuales?: Esquina[];
  tam?: string;
  className?: string;
}) {
  return cuales.map((e) => (
    <Image
      key={e}
      src={ESQUINAS[e].src}
      alt=""
      aria-hidden
      sizes="(min-width: 800px) 300px, 40vw"
      className={`pointer-events-none absolute -z-10 h-auto select-none ${ESQUINAS[e].pos} ${tam} ${className}`}
    />
  ));
}
