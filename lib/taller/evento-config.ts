/**
 * Configuración del taller — actualizar cuando llegue el flyer y datos finales.
 */
export type TallerEventoConfig = {
  slug: string;
  titulo: string;
  /** Ruta en /public; null = placeholder visual hasta tener imagen */
  imagenFlyerSrc: string | null;
  whatsappConsultas: string;
};

export const TALLER_BAHIA_JUNIO_2026: TallerEventoConfig = {
  slug: "taller-bahia-junio-2026",
  titulo: "Taller presencial en Bahía Blanca",
  imagenFlyerSrc: null,
  whatsappConsultas: "5492914296636",
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
