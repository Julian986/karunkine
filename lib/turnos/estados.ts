/**
 * Estados persistidos en MongoDB para la colección `turnos`.
 * La confirmación por pago aprobado pasa a `confirmado` (no confiar en back_urls).
 */
export const TURNO_ESTADOS = [
  "pending_payment",
  "confirmado",
  "contactado",
  "cancelado",
  "expirado",
  /** Legado: reservas creadas antes de Checkout Pro */
  "pendiente",
] as const;

export type TurnoEstadoPersistido = (typeof TURNO_ESTADOS)[number];

export function esEstadoActivoPanel(estado: string): estado is TurnoEstadoPersistido {
  return (TURNO_ESTADOS as readonly string[]).includes(estado);
}
