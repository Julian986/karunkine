import type { TallerInscripcionDoc, TallerInscripcionEstado } from "./create-pending-inscripcion";
import { TALLER_BAHIA_JUNIO_2026, type TallerEventoConfig } from "./evento-config";
import { canonicalPhoneDigitsAR } from "../customer/phone-canonical-ar";

export type PanelTallerEventoResumen = {
  slug: string;
  titulo: string;
  fecha: string;
  fechaCorta: string;
};

export type PanelTallerInscripcionesResumen = {
  confirmados: number;
  pendientes: number;
  expirados: number;
  cancelados: number;
  total: number;
};

export type PanelTallerInscripcionRow = {
  id: string;
  nombre: string;
  mail: string;
  celular: string;
  comentario: string;
  estado: TallerInscripcionEstado;
  eventoTitulo: string;
  eventoFecha: string;
  precioReferenciaArs: number;
  createdAt: string;
  confirmedAt: string | null;
  mpPaymentId: string | null;
};

const ESTADO_SORT: Record<TallerInscripcionEstado, number> = {
  confirmado: 0,
  pending_payment: 1,
  expirado: 2,
  cancelado: 3,
};

const PROFESIONAL_WHATSAPP_FIRMA = "Wanda Perrin";

export function listActiveTallerEventosForPanel(): TallerEventoConfig[] {
  return [TALLER_BAHIA_JUNIO_2026];
}

export function getTallerEventoForPanelBySlug(slug: string): TallerEventoConfig | null {
  return listActiveTallerEventosForPanel().find((e) => e.slug === slug) ?? null;
}

export function panelTallerEventoResumen(evento: TallerEventoConfig): PanelTallerEventoResumen {
  return {
    slug: evento.slug,
    titulo: evento.titulo,
    fecha: evento.fecha,
    fechaCorta: evento.panelFechaCorta,
  };
}

export function docToPanelTallerInscripcionRow(doc: TallerInscripcionDoc): PanelTallerInscripcionRow {
  return {
    id: doc._id.toString(),
    nombre: doc.nombre,
    mail: doc.mail ?? "",
    celular: doc.celular ?? "",
    comentario: doc.comentario ?? "",
    estado: doc.estado,
    eventoTitulo: doc.eventoTitulo,
    eventoFecha: doc.eventoFecha,
    precioReferenciaArs: doc.precioReferenciaArs,
    createdAt: doc.createdAt.toISOString(),
    confirmedAt: doc.confirmedAt ? doc.confirmedAt.toISOString() : null,
    mpPaymentId: doc.mpPaymentId ? String(doc.mpPaymentId) : null,
  };
}

export function sortPanelTallerInscripciones(rows: PanelTallerInscripcionRow[]): PanelTallerInscripcionRow[] {
  return [...rows].sort((a, b) => {
    const ea = ESTADO_SORT[a.estado] ?? 9;
    const eb = ESTADO_SORT[b.estado] ?? 9;
    if (ea !== eb) return ea - eb;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function computePanelTallerResumen(rows: PanelTallerInscripcionRow[]): PanelTallerInscripcionesResumen {
  let confirmados = 0;
  let pendientes = 0;
  let expirados = 0;
  let cancelados = 0;
  for (const r of rows) {
    if (r.estado === "confirmado") confirmados += 1;
    else if (r.estado === "pending_payment") pendientes += 1;
    else if (r.estado === "expirado") expirados += 1;
    else if (r.estado === "cancelado") cancelados += 1;
  }
  return {
    confirmados,
    pendientes,
    expirados,
    cancelados,
    total: rows.length,
  };
}

export function tallerInscripcionStatusChip(estado: TallerInscripcionEstado) {
  if (estado === "confirmado") {
    return {
      badge: "Confirmada",
      badgeClass: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
      showCheck: true,
    };
  }
  if (estado === "pending_payment") {
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
  return {
    badge: "Cancelada",
    badgeClass: "bg-gray-100 text-gray-700",
    showCheck: false,
  };
}

export function buildTallerInscripcionWhatsAppLink(row: Pick<
  PanelTallerInscripcionRow,
  "nombre" | "celular" | "eventoTitulo" | "eventoFecha"
>): string | null {
  const phone = canonicalPhoneDigitsAR(row.celular);
  if (!phone || phone.length < 12) return null;
  const nombre = row.nombre.trim() || "te";
  const text = `Hola ${nombre}, te escribo desde Karün · ${PROFESIONAL_WHATSAPP_FIRMA} por tu inscripción al taller "${row.eventoTitulo}" (${row.eventoFecha}).`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
