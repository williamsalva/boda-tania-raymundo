import Link from "next/link";

export default function NoEncontrada() {
  return (
    <main className="rayas min-h-[100svh] flex items-center justify-center px-6">
      <div className="tarjeta px-8 py-14 text-center max-w-md">
        <p className="font-script text-5xl text-vino">Tania & Raymundo</p>
        <p className="mt-8 text-xl leading-relaxed">
          No encontramos esta invitación. Revisa que el enlace sea el mismo que te enviamos.
        </p>
        <Link
          href="/"
          className="mt-10 inline-block border border-vino/40 px-7 py-3 etiqueta text-vino hover:bg-vino hover:text-white hover:border-vino"
        >
          Ver invitación
        </Link>
      </div>
    </main>
  );
}
