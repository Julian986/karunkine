import type { PanelCalendarioEvento } from "../turnos/panel-events";
import { isHorarioIndividualId } from "../turnos/wanda-schedule";

export type PanelAgendaBlockRow = {
  id: string;
  anchorDateKey: string;
  timeLocal: string;
  durationMinutes: number;
  scope: string;
  recurrence: { type: "weekly"; untilDateKey?: string | null } | null;
  notes?: string | null;
};

export type TurnoEstado =
  | "pending_payment"
  | "pendiente"
  | "contactado"
  | "confirmado"
  | "cancelado"
  | "expirado";

export const ESTADO_OPCIONES: { value: TurnoEstado; label: string }[] = [
  { value: "pending_payment", label: "Pendiente de pago" },
  { value: "pendiente", label: "Pendiente (legado)" },
  { value: "contactado", label: "Contactado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "expirado", label: "Expirada (sin pago)" },
];

const PANEL_REPROGRAM_ESTADOS = new Set<TurnoEstado>([
  "pending_payment",
  "pendiente",
  "contactado",
  "confirmado",
]);

const CAN_MANAGE_ESTADOS = new Set<TurnoEstado>([
  "pending_payment",
  "pendiente",
  "contactado",
  "confirmado",
]);

const PROFESIONAL_WHATSAPP_FIRMA = "Wanda Perrin";

export function canReprogramConsultaIndividual(ev: PanelCalendarioEvento): boolean {
  return (
    ev.modalidad === "consulta_individual" &&
    ev.tipoCita === "consulta_individual" &&
    PANEL_REPROGRAM_ESTADOS.has(ev.estado as TurnoEstado) &&
    isHorarioIndividualId(ev.horarioReserva)
  );
}

export function canManageTurno(ev: PanelCalendarioEvento): boolean {
  return CAN_MANAGE_ESTADOS.has(ev.estado as TurnoEstado);
}

export function origenCardLabel(origen: PanelCalendarioEvento["origenReserva"]): string | null {
  if (origen === "manual") return "Carga manual";
  if (origen === "web") return "Reserva web";
  return null;
}

export function panelResumenVisible(ev: PanelCalendarioEvento): string {
  const formato =
    ev.formatoConsultaLabel ||
    (ev.tipoCita === "evaluacion_grupal" ? ev.formatoEvaluacionLabel : "");
  return [ev.motivoLabel, formato].filter(Boolean).join(" · ");
}

export function panelDetalleLineas(ev: PanelCalendarioEvento): string[] {
  const out: string[] = [];
  if (ev.tipoCita === "clase_grupal" && ev.horarioReservaLabel) {
    out.push(`Franja mensual: ${ev.horarioReservaLabel}`);
  }
  if (ev.tipoCita === "clase_grupal" && ev.horarioEvaluacionLabel) {
    const fmt = ev.formatoEvaluacionLabel ? ` · ${ev.formatoEvaluacionLabel}` : "";
    out.push(`Evaluación: ${ev.horarioEvaluacionLabel}${fmt}`);
  }
  return out;
}

function normalizePhoneForWhatsApp(rawPhone: string): string | null {
  const onlyDigits = rawPhone.replace(/\D/g, "");
  if (onlyDigits.length < 10) return null;
  if (onlyDigits.startsWith("549")) {
    return onlyDigits.length >= 12 && onlyDigits.length <= 15 ? onlyDigits : null;
  }
  if (onlyDigits.startsWith("54")) {
    const withCountry = onlyDigits.slice(2);
    if (withCountry.startsWith("9")) {
      return onlyDigits.length >= 12 && onlyDigits.length <= 15 ? onlyDigits : null;
    }
    const withoutTrunkZero = withCountry.replace(/^0+/, "");
    const withoutNational15 = withoutTrunkZero.replace(/^(\d{2,4})15/, "$1");
    const normalized = `549${withoutNational15}`;
    return normalized.length >= 12 && normalized.length <= 15 ? normalized : null;
  }
  let national = onlyDigits.replace(/^0+/, "");
  national = national.replace(/^(\d{2,4})15/, "$1");
  if (national.startsWith("9")) national = national.slice(1);
  const normalized = `549${national}`;
  return normalized.length >= 12 && normalized.length <= 15 ? normalized : null;
}

function buildWhatsAppMessage(ev: PanelCalendarioEvento): string {
  const nombrePaciente = ev.nombre.trim() || "te";
  const horarioTexto = ev.subtitulo.trim();
  const cuerpoHorario = horarioTexto ? `, ${horarioTexto}` : "";
  const contexto = [ev.motivoLabel, ev.formatoConsultaLabel].filter(Boolean).join(", ");
  const motivoParte = contexto ? ` Motivo: ${contexto}.` : "";
  return `Hola ${nombrePaciente}, soy ${PROFESIONAL_WHATSAPP_FIRMA}. Te escribo por tu reserva (${ev.titulo})${cuerpoHorario}.${motivoParte}`;
}

export function buildWhatsAppLink(ev: PanelCalendarioEvento): string | null {
  const phone = normalizePhoneForWhatsApp(ev.celular);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage(ev))}`;
}

export function turnoStatusChip(ev: PanelCalendarioEvento, inProgress: boolean) {
  const estado = ev.estado;

  if (estado === "cancelado") {
    return {
      badge: "Cancelada",
      badgeClass: "bg-gray-100 text-gray-700",
      showCheck: false,
    };
  }
  if (inProgress) {
    return {
      badge: "En curso",
      badgeClass: "bg-gray-200 text-gray-800",
      showCheck: false,
    };
  }
  if (estado === "pending_payment" || estado === "pendiente") {
    return {
      badge: "Pendiente de pago",
      badgeClass: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
      showCheck: false,
    };
  }
  if (estado === "expirado") {
    return {
      badge: "Expirada",
      badgeClass: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
      showCheck: false,
    };
  }
  if (estado === "contactado") {
    return {
      badge: "Contactado",
      badgeClass: "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
      showCheck: false,
    };
  }
  return {
    badge: "Confirmada",
    badgeClass: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
    showCheck: true,
  };
}

export function scopeLabel(scope: string) {
  if (scope === "agenda") return "Agenda";
  return scope;
}
