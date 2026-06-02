import type { ObjectId } from "mongodb";

import {
  panelFormatoLabel,
  panelHorarioTemplateLabel,
  panelModalidadLabel,
  panelMotivoLabel,
} from "./panel-display-labels";
import { PANEL_HORARIO_LIBRE } from "./panel-manual-schedule-shared";
import { reservaOrigenFromTurno, type ReservaOrigen } from "./reserva-origen";
import type { CitaDoc } from "./wanda-schedule";
import { formatDisplayFechaHora } from "./wanda-schedule";
import {
  isHorarioGrupalId,
  isHorarioIndividualId,
  isoDateWeekday,
  timeForGrupalTemplate,
  timeForIndividualTemplate,
  utcTodayDateKey,
  weekdayForIndividualTemplate,
} from "./wanda-schedule";

export type PanelCalendarioEvento = {
  id: string;
  turnoId: string;
  dateKey: string;
  timeLocal: string;
  titulo: string;
  subtitulo: string;
  estado: string;
  nombre: string;
  mail: string;
  celular: string;
  notaInterna: string;
  modalidad: "grupal" | "consulta_individual";
  tipoCita: string;
  motivo: string;
  motivoLabel: string;
  formatoConsulta: "" | "presencial" | "virtual";
  formatoConsultaLabel: string;
  formatoEvaluacion: "" | "presencial" | "virtual";
  formatoEvaluacionLabel: string;
  modalidadLabel: string;
  turnoDetalle: string;
  horarioReserva: string;
  horarioReservaLabel: string;
  horarioEvaluacion: string;
  horarioEvaluacionLabel: string;
  citaTemplateId: string;
  citaTemplateLabel: string;
  mpPaymentId: string;
  origenReserva: ReservaOrigen;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function firstWeekdayOnOrAfter(fromDateKey: string, weekday: number): string | null {
  for (let i = 0; i < 14; i++) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fromDateKey);
    if (!m) return null;
    const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + i);
    const d = new Date(t);
    const dk = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
    if (d.getUTCDay() === weekday) return dk;
  }
  return null;
}

function legacyPreviewCita(row: {
  modalidad?: string;
  horario?: string;
  horarioEvaluacion?: string;
}): CitaDoc | null {
  const from = utcTodayDateKey();
  if (row.modalidad === "consulta_individual" && row.horario && isHorarioIndividualId(row.horario)) {
    const wd = weekdayForIndividualTemplate(row.horario);
    const dk = firstWeekdayOnOrAfter(from, wd);
    const tl = timeForIndividualTemplate(row.horario);
    if (!dk) return null;
    return { dateKey: dk, timeLocal: tl, tipo: "consulta_individual", templateId: row.horario };
  }
  if (row.modalidad === "grupal" && row.horarioEvaluacion && isHorarioIndividualId(row.horarioEvaluacion)) {
    const id = row.horarioEvaluacion;
    const wd = weekdayForIndividualTemplate(id);
    const dk = firstWeekdayOnOrAfter(from, wd);
    const tl = timeForIndividualTemplate(id);
    if (!dk) return null;
    return { dateKey: dk, timeLocal: tl, tipo: "evaluacion_grupal", templateId: id };
  }
  if (row.modalidad === "grupal" && row.horario && isHorarioGrupalId(row.horario)) {
    const dk = firstWeekdayOnOrAfter(from, 2) ?? firstWeekdayOnOrAfter(from, 4);
    if (!dk) return null;
    const tl = timeForGrupalTemplate(row.horario);
    return { dateKey: dk, timeLocal: tl, tipo: "clase_grupal", templateId: row.horario };
  }
  return null;
}

function tipoLabel(tipo: string): string {
  if (tipo === "consulta_individual") return "Consulta individual";
  if (tipo === "evaluacion_grupal") return "Evaluación (grupal)";
  if (tipo === "clase_grupal") return "Clase grupal";
  return tipo;
}

const DATE_KEY_YMD = /^\d{4}-\d{2}-\d{2}$/;

function isValidCitaForPanel(c: CitaDoc | undefined): c is CitaDoc {
  if (!c?.dateKey || c.timeLocal == null) return false;
  return DATE_KEY_YMD.test(String(c.dateKey).trim());
}

export function expandTurnoToPanelEventos(
  row: Record<string, unknown> & { _id: ObjectId },
): PanelCalendarioEvento[] {
  const id = row._id.toHexString();
  const estado = String(row.estado ?? "");
  const nombre = String(row.nombre ?? "");
  const mail = String(row.mail ?? "");
  const celular = String(row.celular ?? "");
  const notaInterna = String(row.notaInterna ?? "");
  const modalidad = row.modalidad === "consulta_individual" ? "consulta_individual" : "grupal";
  const motivo = String(row.motivo ?? "").trim();
  const formatoConsulta =
    row.formatoConsulta === "presencial" || row.formatoConsulta === "virtual" ? row.formatoConsulta : "";
  const formatoEvaluacion =
    row.formatoEvaluacion === "presencial" || row.formatoEvaluacion === "virtual" ? row.formatoEvaluacion : "";
  const horarioReserva = String(row.horario ?? "").trim();
  const horarioEvaluacion = String(row.horarioEvaluacion ?? "").trim();
  const turnoDetalle = String(row.turnoDetalle ?? "").trim();
  const mpPaymentId = String(row.mpPaymentId ?? "").trim();
  const origenReserva = reservaOrigenFromTurno(row);
  const rawCitas = row.citas as CitaDoc[] | undefined;
  const fromDoc =
    Array.isArray(rawCitas) && rawCitas.length > 0 ? rawCitas.filter((c) => isValidCitaForPanel(c)) : [];
  const citasRaw =
    fromDoc.length > 0
      ? fromDoc
      : (() => {
          const one = legacyPreviewCita(row as { modalidad?: string; horario?: string; horarioEvaluacion?: string });
          return one && isValidCitaForPanel(one) ? [one] : [];
        })();

  /** Turnos manuales con evaluación libre: no mostrar ciclo mar/jue guardado por error en versiones anteriores. */
  const ocultarClaseGrupalPanel =
    modalidad === "grupal" &&
    (horarioReserva === PANEL_HORARIO_LIBRE || horarioEvaluacion === PANEL_HORARIO_LIBRE);
  const citas = citasRaw.filter(
    (c) => !(ocultarClaseGrupalPanel && c.tipo === "clase_grupal"),
  );

  return citas.map((c, idx) => {
    const citaTemplateId = String(c.templateId ?? "").trim();
    return {
      id: `${id}-${idx}-${c.dateKey}-${c.timeLocal}`,
      turnoId: id,
      dateKey: c.dateKey,
      timeLocal: c.timeLocal,
      titulo: tipoLabel(c.tipo),
      subtitulo: formatDisplayFechaHora(c.dateKey, c.timeLocal),
      estado,
      nombre,
      mail,
      celular,
      notaInterna,
      modalidad,
      tipoCita: c.tipo,
      motivo,
      motivoLabel: panelMotivoLabel(motivo),
      formatoConsulta,
      formatoConsultaLabel: panelFormatoLabel(formatoConsulta),
      formatoEvaluacion,
      formatoEvaluacionLabel: panelFormatoLabel(formatoEvaluacion),
      modalidadLabel: panelModalidadLabel(modalidad),
      turnoDetalle,
      horarioReserva,
      horarioReservaLabel: panelHorarioTemplateLabel(horarioReserva),
      horarioEvaluacion,
      horarioEvaluacionLabel: panelHorarioTemplateLabel(horarioEvaluacion),
      citaTemplateId,
      citaTemplateLabel: panelHorarioTemplateLabel(citaTemplateId),
      mpPaymentId,
      origenReserva,
    };
  });
}

export function eventoInMonth(e: PanelCalendarioEvento, year: number, month: number): boolean {
  const m = /^(\d{4})-(\d{2})-/.exec(e.dateKey);
  if (!m) return false;
  return Number(m[1]) === year && Number(m[2]) === month;
}
