import type { CitaDoc } from "./wanda-schedule";
import { formatDisplayFechaHora } from "./wanda-schedule";

export function buildTurnoDetalleFromCitas(params: {
  citas: CitaDoc[];
  modalidad: "grupal" | "consulta_individual";
  formatoConsulta?: "presencial" | "virtual";
  formatoEvaluacion?: "presencial" | "virtual";
}): string {
  const ev = params.citas.find((c) => c.tipo === "evaluacion_grupal");
  const ind = params.citas.find((c) => c.tipo === "consulta_individual");
  const clase = params.citas.find((c) => c.tipo === "clase_grupal");

  if (params.modalidad === "consulta_individual" && ind) {
    const fmt =
      params.formatoConsulta === "virtual"
        ? "virtual"
        : params.formatoConsulta === "presencial"
          ? "presencial"
          : "";
    const suf = fmt ? ` (${fmt})` : "";
    return `Consulta individual: ${formatDisplayFechaHora(ind.dateKey, ind.timeLocal)}${suf}`;
  }

  if (params.modalidad === "grupal" && clase && ev) {
    const fmtEv =
      params.formatoEvaluacion === "virtual"
        ? "virtual"
        : params.formatoEvaluacion === "presencial"
          ? "presencial"
          : "";
    const evPart = `${formatDisplayFechaHora(ev.dateKey, ev.timeLocal)}${fmtEv ? ` (${fmtEv})` : ""}`;
    return `Clases grupales desde ${formatDisplayFechaHora(clase.dateKey, clase.timeLocal)} · Evaluación: ${evPart}`;
  }

  return params.citas.map((c) => `${c.tipo} ${c.dateKey} ${c.timeLocal}`).join(" · ");
}
