/**
 * Tipos y helpers usados en el cliente (sin MongoDB).
 */

export type CustomerTurnoPublic = {
  id: string;
  estado: string;
  modalidad: "consulta_individual" | "grupal";
  turnoDetalle: string;
  /** Primera cita para ordenar / mostrar */
  displayStartsAt: string;
  primeraCitaLabel: string;
  /** Día y fecha sin hora (ej. “Martes 15/04”). */
  displayFechaLine: string;
  /** Hora sola (ej. “09:30”). */
  displayHoraLine: string;
  canCancel: boolean;
  canRescheduleIndividual: boolean;
  formatoConsulta?: "presencial" | "virtual";
};

export function isUpcomingTurno(t: CustomerTurnoPublic, todayDateKeyUtc: string): boolean {
  if (t.estado === "cancelado" || t.estado === "expirado") return false;
  const m = /^(\d{4}-\d{2}-\d{2})T/.exec(t.displayStartsAt);
  if (!m) return false;
  return m[1] >= todayDateKeyUtc;
}
