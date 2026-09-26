// Contenido fijo de la invitación. Todo lo que Tania quiera cambiar vive aquí.

export const NOVIOS = {
  ella: "Tania Alexandra Alba García",
  el: "Raymundo García León",
  ellaCorto: "Tania",
  elCorto: "Raymundo",
  iniciales: "T & R",
};

// 11 de diciembre de 2026, 7:00 p. m. en Guadalajara (UTC-6, sin horario de verano).
export const FECHA_BODA = "2026-12-11T19:00:00-06:00";
export const FECHA_TEXTO = "11 · 12 · 2026";
export const FECHA_LARGA = "Viernes 11 de diciembre de 2026";
// TODO: pedir a Tania la fecha límite para confirmar (ej. "15 de noviembre"). null = no se muestra.
export const FECHA_LIMITE_RSVP: string | null = null;

export const EVENTOS = [
  {
    titulo: "Misa",
    hora: "7:00 p. m.",
    lugar: "Templo Expiatorio del Santísimo Sacramento",
    mapa: "https://maps.app.goo.gl/NXSPa17qqHgAjCts8",
    ilustracion: "/ilustraciones/ceremonia_anillos.jpg",
  },
  {
    titulo: "Recepción",
    hora: "9:00 p. m.",
    lugar: "Casino El Tejado",
    mapa: "https://maps.app.goo.gl/sc2oZRSmfSNJ3uhj6",
    ilustracion: "/ilustraciones/recepcion_copas.jpg",
  },
];

export const CODIGO_VESTIMENTA = {
  titulo: "Código de vestimenta",
  tipo: "Riguroso Formal",
  nota: "(No Guayaberas)",
  ilustracion: "/ilustraciones/codigo_vestimenta.jpg",
};

export const ILUSTRACIONES = {
  pareja: "/ilustraciones/pareja.png",
  codigoVestimenta: "/ilustraciones/codigo_vestimenta.jpg",
  ceremonia: "/ilustraciones/ceremonia_anillos.jpg",
  recepcion: "/ilustraciones/recepcion_copas.jpg",
  rsvp: "/ilustraciones/rsvp_sobre_lacre.jpg",
  regalos: "/ilustraciones/mesa_regalos.jpg",
  hospedaje: "/ilustraciones/hospedaje.svg",
  cancion: "/ilustraciones/cancion.svg",
  botanica: "/ilustraciones/botanica.svg",
  ramillete: "/ilustraciones/ramillete_floral.svg",
  esquinero: "/ilustraciones/esquinero_botanico.svg",
  corona: "/ilustraciones/corona_floral.svg",
  divisor: "/ilustraciones/divisor_floral.svg",
};

export const VERSICULO = {
  texto:
    "Ponme como un sello sobre tu corazón, como un sello sobre tu brazo; porque el amor es fuerte como la muerte.",
  cita: "Cantar de los Cantares 8,\u00a06",
};

export const PADRES = {
  novia: ["Ramiro Alba Aguilar", "Lorena García Betancourt"],
  novio: ["Carlos García Mares", "† Marina García León"],
};

// TODO: el mensaje original venía cortado ("Julio César Rodr…"). Confirmar el nombre completo con Tania.
export const PADRINOS_VELACION = ["Ahtziri Janeth Alba García", "Julio César Rodr…"];

export const MESA_REGALOS = {
  tienda: "Liverpool",
  evento: "52024839",
  url: "https://mesaderegalos.liverpool.com.mx/milistaderegalos/52024839",
};

export const HOSPEDAJE = [
  {
    zona: "Cerca del Templo Expiatorio",
    hoteles: [
      "Six Hotel Guadalajara Expiatorio",
      "Hotel Libertad 1416",
      "Casa Matia",
      "Casa Vilasanta",
    ],
  },
  {
    zona: "Cerca de la recepción",
    hoteles: [
      "Hotel Jacarandas",
      "Country Hotel & Suites",
      "Residence Inn by Marriott Guadalajara Country Club",
    ],
  },
];

export const SPOTIFY_TRACK = "2kfGoV9a5dbSKCNmUWH2ZF";

export const GALERIA = {
  url: "https://edgarcruzfotografia40.pixieset.com/savethedatetaniayraymundo/",
  nip: "2237",
  fotografo: "Edgar Cruz Fotografía",
};

export const FOTOS = {
  portada: "/fotos/00.jpg",
  portadaAncha: "/fotos/04.jpg",
};

export function mapsBusqueda(lugar: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lugar}, Guadalajara, Jalisco`)}`;
}
