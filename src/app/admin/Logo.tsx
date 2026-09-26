import Image from "next/image";
import foto from "../../../public/fotos/10.jpg";

/** Foto de los novios como logo del panel, recortada a sus caras. */
export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    <span className={`relative shrink-0 overflow-hidden rounded-lg ring-1 ring-black/5 ${className}`}>
      <Image
        src={foto}
        alt="Tania y Raymundo"
        fill
        sizes="80px"
        className="scale-[1.9] object-cover object-[50%_34%]"
        style={{ transformOrigin: "50% 40%" }}
      />
    </span>
  );
}
