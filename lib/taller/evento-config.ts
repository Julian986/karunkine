/**

 * Configuración del taller — actualizar cuando llegue el flyer y datos finales.

 */

export const TALLER_MAPS_URL =

  "https://www.google.com/maps/search/?api=1&query=Viamonte%201233%2C%20Bah%C3%ADa%20Blanca";



export type TallerEventoConfig = {

  slug: string;

  titulo: string;

  subtitulo: string;

  tagline: string;

  imagenFlyerSrc: string | null;

  whatsappConsultas: string;

  mapsUrl: string;

  descripcion: string;

  beneficios: readonly string[];

  fecha: string;

  horario: string;

  lugar: string;

  modalidad: string;

  publico: string;

  inscripcion: string;

  precioArs: number;

};



export const TALLER_BAHIA_JUNIO_2026: TallerEventoConfig = {

  slug: "taller-bahia-junio-2026",

  titulo: "Liberá tu pelvis",

  subtitulo: "Taller teórico-práctico",

  tagline: "Reconexión y liberación del suelo pélvico",

  imagenFlyerSrc: "/taller.jpeg",

  whatsappConsultas: "5492914296636",

  mapsUrl: TALLER_MAPS_URL,

  descripcion:

    "Es un taller único diseñado para el público general en el que aprenderás a liberar los bloqueos de tu suelo pélvico y a reconectar con él desde la respiración y la conciencia corporal en un espacio seguro y libre de juicios.",

  beneficios: [

    "Potenciar la conexión con tu suelo pélvico.",

    "Experimentar la influencia de la respiración y el ejercicio hipopresivo.",

    "Poner en práctica técnicas de automasaje para la musculatura externa.",

    "Contar con la información necesaria para relajar la musculatura profunda en la comodidad de tu hogar.",

    "Aprender cómo funciona tu suelo pélvico, cómo se fortalece y qué factores influyen en su estado de salud.",

    "Un espacio anónimo y libre de juicios para despejar dudas.",

  ],

  fecha: "Sábado 27 de junio de 2026",

  horario: "De 14:00 a 18:00 h",

  lugar: "KARÜN — Viamonte 1233, Bahía Blanca",

  modalidad: "Presencial en Bahía Blanca",

  publico: "Abierto al público en general",

  inscripcion: "Con inscripción previa",

  precioArs: 60_000,

};



/** Campos del formulario de inscripción (fácil de ampliar después). */

export const TALLER_FORM_FIELDS = {

  nombre: { label: "Nombre y apellido", placeholder: "Nombre y apellido", required: true },

  mail: { label: "Mail", placeholder: "Mail", required: true },

  celular: { label: "Celular", placeholder: "Celular", required: true },

  comentario: {

    label: "Comentario (opcional)",

    placeholder: "Alguna consulta o dato que quieras agregar",

    required: false,

  },

} as const;



export function formatPrecioArs(monto: number): string {

  return new Intl.NumberFormat("es-AR", {

    style: "currency",

    currency: "ARS",

    maximumFractionDigits: 0,

  }).format(monto);

}


