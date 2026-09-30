import Image, { getImageProps, type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import {
  CODIGO_VESTIMENTA,
  EVENTOS,
  FECHA_BODA,
  FECHA_LARGA,
  FECHA_LIMITE_RSVP,
  FECHA_TEXTO,
  FOTOS,
  GALERIA,
  HOSPEDAJE,
  MESA_REGALOS,
  NOVIOS,
  PADRES,
  PADRINOS_VELACION,
  VERSICULO,
  mapsBusqueda,
} from "@/lib/boda";
import type { Familia } from "@/lib/familias";
import anillos from "../../public/ilustraciones/linea/anillos.png";
import copas from "../../public/ilustraciones/linea/copas.png";
import pareja from "../../public/ilustraciones/linea/pareja.png";
import regalo from "../../public/ilustraciones/linea/regalo.png";
import vestimenta from "../../public/ilustraciones/linea/vestimenta.png";
import { CuentaRegresiva } from "./CuentaRegresiva";
import { Galeria } from "./Galeria";
import { Esquinas } from "./Ornamentos";
import { Revelar } from "./Revelar";
import { Rsvp } from "./Rsvp";
import { Sobre } from "./Sobre";

const ILUSTRACION_EVENTO: Record<string, StaticImageData> = { Misa: anillos, Recepción: copas };

type Fondo = "perla" | "rubor" | "rayas";
const FONDOS: Record<Fondo, string> = { perla: "bg-perla", rubor: "bg-rubor", rayas: "rayas" };

/** Todas las secciones comparten ritmo, ancho y encabezado. */
function Seccion({
  id,
  fondo,
  antetitulo,
  titulo,
  ilustracion,
  ancho = "max-w-3xl",
  children,
}: {
  id?: string;
  fondo: Fondo;
  antetitulo?: string;
  titulo?: string;
  ilustracion?: { src: StaticImageData; alt: string; className?: string };
  ancho?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`px-5 py-20 sm:py-28 ${FONDOS[fondo]}`}>
      <div className={`mx-auto ${ancho} text-center`}>
        {titulo && (
          <Revelar className="mb-12 flex flex-col items-center">
            {ilustracion && (
              <Image
                src={ilustracion.src}
                alt={ilustracion.alt}
                className={`mb-6 h-auto ${ilustracion.className ?? "w-28"}`}
              />
            )}
            {antetitulo && <p className="etiqueta text-rosa mb-3">{antetitulo}</p>}
            <h2 className="titulo-seccion">{titulo}</h2>
          </Revelar>
        )}
        {children}
      </div>
    </section>
  );
}

function Boton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="relative z-10 inline-block border border-vino/40 px-7 py-3 etiqueta text-vino transition-colors hover:border-vino hover:bg-vino hover:text-white"
    >
      {children}
    </a>
  );
}

function Nombres({ nombres }: { nombres: string[] }) {
  return nombres.map((n) => (
    <p key={n} className="text-2xl leading-relaxed">
      {n}
    </p>
  ));
}

/** Foto vertical en celular y horizontal en pantallas grandes; el navegador descarga solo una. */
function Portada() {
  const alt = `${NOVIOS.ellaCorto} y ${NOVIOS.elCorto}`;
  const comun = { alt, fill: true, priority: true, sizes: "100vw" };
  const {
    props: { srcSet: ancha },
  } = getImageProps({ ...comun, src: FOTOS.portadaAncha });
  const { props } = getImageProps({ ...comun, src: FOTOS.portada });
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={ancha} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt viene en props */}
      <img {...props} className="object-cover object-[50%_30%] md:object-[50%_40%]" />
    </picture>
  );
}

export function Invitacion({ familia }: { familia?: Familia }) {
  return (
    <main className="overflow-x-clip">
      <Sobre para={familia?.nombre} />

      {/* Portada */}
      <header className="relative h-[100svh] min-h-[560px] w-full">
        <Portada />
        <div className="absolute inset-0 bg-gradient-to-b from-vino/20 via-transparent to-tinta/75" />
        <div className="absolute inset-x-0 bottom-0 pb-14 sm:pb-20 px-6 text-center text-white">
          <p className="etiqueta text-white/85 mb-4">Nos casamos</p>
          <h1 className="font-script text-6xl sm:text-8xl leading-[1.1] drop-shadow-md">
            {NOVIOS.ellaCorto}
            <span className="block text-4xl my-1 md:inline md:mx-5 md:text-6xl">&</span>
            {NOVIOS.elCorto}
          </h1>
          <p className="mt-4 font-serif text-xl sm:text-2xl tracking-[0.3em]">{FECHA_TEXTO}</p>
        </div>
      </header>

      {/* Apertura */}
      <Seccion fondo="perla">
        <Revelar>
          <p className="font-serif italic text-2xl sm:text-3xl leading-relaxed text-vino text-balance">
            “Después de tantos momentos compartidos, hoy elegimos compartir toda la vida.”
          </p>
        </Revelar>
        <Revelar retraso={150} className="mt-12">
          <Image
            src={pareja}
            alt={`Ilustración de ${NOVIOS.ellaCorto} y ${NOVIOS.elCorto}`}
            className="mx-auto h-auto w-44 sm:w-52"
            priority
          />
        </Revelar>
        <Revelar retraso={200} className="mt-10 space-y-1">
          <p className="font-script text-4xl sm:text-5xl text-vino text-balance">{NOVIOS.ella}</p>
          <p className="font-script text-3xl text-rosa">&</p>
          <p className="font-script text-4xl sm:text-5xl text-vino text-balance">{NOVIOS.el}</p>
        </Revelar>
        <Revelar retraso={300} className="mt-12">
          <p className="text-xl leading-relaxed max-w-xl mx-auto">
            Con la bendición de Dios y de nuestros padres, tenemos el gusto de invitarte a celebrar
            nuestra boda.
          </p>
          <p className="mt-6 etiqueta text-vino">{FECHA_LARGA}</p>
        </Revelar>
      </Seccion>

      {/* Cuenta regresiva */}
      <section className="relative overflow-hidden bg-vino px-6 py-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,#c94a91_0%,transparent_55%),radial-gradient(circle_at_90%_100%,#c40a78_0%,transparent_50%)] opacity-50" />
        <div className="relative">
          <p className="etiqueta text-white/80 mb-3">Faltan</p>
          <p className="font-script text-4xl sm:text-5xl text-white mb-10">para el gran día</p>
          <CuentaRegresiva fecha={FECHA_BODA} />
        </div>
      </section>

      {/* Ceremonia y recepción */}
      <Seccion id="evento" fondo="rubor" antetitulo="Acompáñanos" titulo="El gran día">
        <div className="grid gap-6 sm:grid-cols-2">
          {EVENTOS.map((evento, i) => (
            <Revelar key={evento.titulo} retraso={i * 150} className="h-full">
              <article className="tarjeta h-full px-6 pt-10 pb-12 flex flex-col items-center">
                <Image
                  src={ILUSTRACION_EVENTO[evento.titulo]}
                  alt=""
                  className="h-20 w-auto mb-4"
                />
                <p className="font-script text-5xl text-vino">{evento.titulo}</p>
                <p className="mt-3 font-serif text-3xl font-light tracking-wider">{evento.hora}</p>
                <p className="mt-5 text-xl leading-snug max-w-[16rem] flex-1">{evento.lugar}</p>
                <div className="mt-8">
                  <Boton href={evento.mapa}>Cómo llegar</Boton>
                </div>
              </article>
            </Revelar>
          ))}
        </div>
      </Seccion>

      {/* Versículo */}
      <Seccion fondo="perla">
        <Revelar className="tarjeta overflow-hidden mx-auto max-w-2xl px-10 py-24 sm:px-16">
          <Esquinas cuales={["sup-izq", "inf-der"]} tam="w-28 sm:w-36" />
          <p className="relative font-serif italic text-2xl sm:text-3xl leading-relaxed text-vino text-balance">
            “{VERSICULO.texto}”
          </p>
          <p className="relative mt-6 etiqueta text-rosa text-balance">{VERSICULO.cita}</p>
        </Revelar>
      </Seccion>

      {/* Código de vestimenta */}
      <Seccion
        id="vestimenta"
        fondo="rubor"
        antetitulo="Para la ocasión"
        titulo={CODIGO_VESTIMENTA.titulo}
        ilustracion={{ src: vestimenta, alt: "Ilustración de los novios bailando", className: "w-64 sm:w-72" }}
      >
        <Revelar className="tarjeta mx-auto max-w-md px-8 py-12">
          <p className="font-serif text-3xl tracking-[0.18em] uppercase text-vino">
            {CODIGO_VESTIMENTA.tipo}
          </p>
          <p className="mt-2 etiqueta text-rosa">{CODIGO_VESTIMENTA.nota}</p>
          <p className="mt-6 text-lg italic leading-relaxed text-tinta/80 text-balance">
            Agradecemos acompañarnos de rigurosa etiqueta y reservar el color blanco exclusivamente
            para la novia.
          </p>
        </Revelar>
      </Seccion>

      {/* Padres y padrinos */}
      <Seccion fondo="perla" antetitulo="Con la bendición de" titulo="Nuestros padres">
        <div className="grid gap-12 sm:grid-cols-2">
          <Revelar>
            <p className="etiqueta text-rosa mb-4">De la novia</p>
            <Nombres nombres={PADRES.novia} />
          </Revelar>
          <Revelar retraso={150}>
            <p className="etiqueta text-rosa mb-4">Del novio</p>
            <Nombres nombres={PADRES.novio} />
          </Revelar>
        </div>
        <Revelar className="mt-16">
          <p className="etiqueta text-rosa mb-4">Padrinos de velación</p>
          <Nombres nombres={PADRINOS_VELACION} />
        </Revelar>
      </Seccion>

      {/* Galería */}
      <Seccion fondo="rubor" antetitulo="Momentos" titulo="Galería" ancho="max-w-5xl">
        <Galeria />
        <Revelar className="mt-12">
          <Boton href={GALERIA.url}>Ver galería completa</Boton>
        </Revelar>
      </Seccion>

      {/* Regalos */}
      <Seccion
        fondo="perla"
        antetitulo="Un detalle"
        titulo="Mesa de regalos"
        ilustracion={{ src: regalo, alt: "Ilustración de un regalo con moño", className: "w-28" }}
      >
        <Revelar>
          <p className="text-xl leading-relaxed max-w-xl mx-auto text-balance">
            Su presencia es nuestro mejor regalo; si desean tener un detalle con nosotros, les
            compartimos nuestra mesa.
          </p>
        </Revelar>
        <Revelar className="tarjeta mx-auto mt-10 max-w-sm px-8 py-12">
          <p className="font-serif text-3xl tracking-[0.2em] uppercase text-vino">
            {MESA_REGALOS.tienda}
          </p>
          <p className="mt-2 etiqueta text-tinta/70">Evento #{MESA_REGALOS.evento}</p>
          <div className="mt-8">
            <Boton href={MESA_REGALOS.url}>Ver mesa de regalos</Boton>
          </div>
        </Revelar>
      </Seccion>

      {/* Hospedaje */}
      <Seccion fondo="rubor" antetitulo="Si vienes de fuera" titulo="Hospedaje">
        <Revelar>
          <p className="text-xl leading-relaxed max-w-xl mx-auto text-balance">
            Para nuestros invitados que nos acompañan desde fuera de Guadalajara, les compartimos
            algunas opciones de alojamiento cercanas a los lugares de nuestra celebración.
          </p>
        </Revelar>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {HOSPEDAJE.map((grupo, i) => (
            <Revelar key={grupo.zona} retraso={i * 150} className="h-full">
              <div className="tarjeta h-full px-6 py-10">
                <p className="etiqueta text-rosa mb-6">{grupo.zona}</p>
                <ul className="relative z-10 space-y-3">
                  {grupo.hoteles.map((hotel) => (
                    <li key={hotel}>
                      <a
                        href={mapsBusqueda(hotel)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xl underline decoration-rosa/30 underline-offset-4 hover:text-vino hover:decoration-vino"
                      >
                        {hotel}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Revelar>
          ))}
        </div>
      </Seccion>

      {/* Confirmación */}
      <section id="confirmar" className="rayas px-4 py-20 sm:py-28">
        <Revelar className="tarjeta overflow-hidden mx-auto max-w-2xl px-6 py-16 sm:px-12 text-center">
          <Esquinas cuales={["sup-izq", "sup-der"]} tam="w-28 sm:w-40" />
          <h2 className="relative titulo-seccion mt-28 sm:mt-24">Confirma tu asistencia</h2>
          {familia ? (
            <div className="relative z-10">
              <p className="mt-10 font-serif italic text-2xl text-tinta">{familia.nombre}</p>
              <p className="mt-6 text-xl">Hemos reservado para ustedes</p>
              <p className="my-4 font-script text-7xl text-vino leading-none">
                {familia.invitados.length}
              </p>
              <p className="etiqueta text-vino">
                {familia.invitados.length === 1 ? "lugar" : "lugares"}
              </p>
              <p className="mt-8 mb-12 text-base text-tinta/70">
                {FECHA_LIMITE_RSVP
                  ? `Les agradeceremos confirmar antes del ${FECHA_LIMITE_RSVP}.`
                  : "Les agradeceremos confirmar su asistencia."}
              </p>
              <Rsvp slug={familia.slug} invitados={familia.invitados} previo={familia} />
            </div>
          ) : (
            <div className="mt-8 max-w-md mx-auto space-y-4">
              <p className="text-lg leading-relaxed text-tinta/80">
                Para confirmar tus lugares reservados, por favor ingresa con el enlace personalizado
                que enviamos a tu familia.
              </p>
              <p className="etiqueta text-vino">¡Nos encantará contar con tu presencia!</p>
            </div>
          )}
        </Revelar>
      </section>

      <footer className="bg-vino px-6 py-16 text-center text-white">
        <p className="font-script text-[2.6rem] sm:text-5xl whitespace-nowrap">
          {NOVIOS.ellaCorto} & {NOVIOS.elCorto}
        </p>
        <p className="mt-4 font-serif tracking-[0.3em]">{FECHA_TEXTO}</p>
        <p className="mt-8 etiqueta text-white/70">¡Te esperamos!</p>
      </footer>
    </main>
  );
}
