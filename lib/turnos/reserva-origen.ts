import { PANEL_HORARIO_LIBRE } from "./panel-manual-schedule-shared";

/** Cómo se creó la reserva: panel de Wanda o web pública. */
export type ReservaOrigen = "manual" | "web";

const ORIGEN_LABEL: Record<ReservaOrigen, string> = {
  manual: "Manual",
  web: "Usuario",
};

export function reservaOrigenLabel(origen: ReservaOrigen): string {
  return ORIGEN_LABEL[origen];
}

export function reservaOrigenFromTurno(row: Record<string, unknown>): ReservaOrigen {
  const codigo = String(row.turnoCodigo ?? "").trim();
  if (codigo.startsWith("panel_manual|")) return "manual";

  if (String(row.externalReference ?? "").trim()) return "web";
  if (String(row.mpPaymentId ?? "").trim()) return "web";

  const horario = String(row.horario ?? "").trim();
  const horarioEval = String(row.horarioEvaluacion ?? "").trim();
  if (horario === PANEL_HORARIO_LIBRE || horarioEval === PANEL_HORARIO_LIBRE) return "manual";

  if (codigo.length > 0) return "web";

  return "manual";
}
