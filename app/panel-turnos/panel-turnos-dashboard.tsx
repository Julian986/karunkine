"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  agendaBlockAppliesToDateKey,
  type AgendaBlockRule,
} from "../../lib/booking/agenda-blocks-shared";
import {
  PANEL_WEEK_LETTERS,
  buildPanelMonthGrid,
  panelMonthTitle,
} from "../../lib/booking/panel-month-grid";
import type { PanelCalendarioEvento } from "../../lib/turnos/panel-events";

type PanelAgendaBlockRow = {
  id: string;
  anchorDateKey: string;
  timeLocal: string;
  durationMinutes: number;
  scope: string;
  recurrence: { type: "weekly"; untilDateKey?: string | null } | null;
  notes?: string | null;
};

type TurnoEstado =
  | "pending_payment"
  | "pendiente"
  | "contactado"
  | "confirmado"
  | "cancelado"
  | "expirado";

const ESTADO_OPCIONES: { value: TurnoEstado; label: string }[] = [
  { value: "pending_payment", label: "Pendiente de pago" },
  { value: "pendiente", label: "Pendiente (legado)" },
  { value: "contactado", label: "Contactado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "expirado", label: "Expirada (sin pago)" },
];

type DayRow =
  | { kind: "reservation"; item: PanelCalendarioEvento }
  | { kind: "block"; item: PanelAgendaBlockRow };

const PROFESIONAL_WHATSAPP_FIRMA = "Wanda Perrin";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayYmd(local: Date) {
  return `${local.getFullYear()}-${pad2(local.getMonth() + 1)}-${pad2(local.getDate())}`;
}

function weekdayLongFromKey(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const w = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(dt);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function dayLongFromKey(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" }).format(dt);
}

function scopeLabel(scope: string) {
  if (scope === "agenda") return "Agenda";
  return scope;
}

/* Reprogramar (panel) deshabilitado por ahora
const PANEL_REPROGRAM_ESTADOS = new Set(["pending_payment", "pendiente", "contactado", "confirmado"]);

function canReprogramConsultaIndividual(ev: PanelCalendarioEvento): boolean {
  return (
    ev.modalidad === "consulta_individual" &&
    ev.tipoCita === "consulta_individual" &&
    PANEL_REPROGRAM_ESTADOS.has(ev.estado)
  );
}
*/

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

function panelResumenVisible(ev: PanelCalendarioEvento): string {
  const formato =
    ev.formatoConsultaLabel ||
    (ev.tipoCita === "evaluacion_grupal" ? ev.formatoEvaluacionLabel : "");
  return [ev.motivoLabel, formato].filter(Boolean).join(" · ");
}

/** Líneas extra solo para grupal (no repetir lo que ya está en la tarjeta). */
function panelDetalleLineasGrupal(ev: PanelCalendarioEvento): string[] {
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

function DetalleFila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const v = valor.trim();
  if (!v) return null;
  return (
    <div className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2 gap-y-0.5 text-[12px] leading-snug">
      <span className="font-medium text-[var(--brand-cream)]/48">{etiqueta}</span>
      <span className="text-[var(--brand-cream)]/88">{v}</span>
    </div>
  );
}

function PanelTurnoDetalleExpand({
  ev,
  guardandoId,
  onEstadoChange,
  onNotaChange,
  onNotaBlur,
}: {
  ev: PanelCalendarioEvento;
  guardandoId: string | null;
  onEstadoChange: (estado: TurnoEstado) => void;
  onNotaChange: (value: string) => void;
  onNotaBlur: (value: string) => void;
}) {
  const lineasGrupal = panelDetalleLineasGrupal(ev);
  const hayContacto = Boolean(ev.mail.trim() || ev.celular.trim());

  return (
    <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
      {hayContacto ? (
        <div className="space-y-1.5">
          <DetalleFila etiqueta="Mail" valor={ev.mail} />
          <DetalleFila etiqueta="Celular" valor={ev.celular} />
        </div>
      ) : null}

      {lineasGrupal.length > 0 ? (
        <div className="space-y-1 text-[12px] leading-snug text-[var(--brand-cream)]/78">
          {lineasGrupal.map((linea) => (
            <p key={linea}>{linea}</p>
          ))}
        </div>
      ) : null}

      {ev.mpPaymentId ? (
        <p className="text-[11px] text-[var(--brand-cream)]/50">
          Ref. Mercado Pago: <span className="text-[var(--brand-cream)]/75">{ev.mpPaymentId}</span>
        </p>
      ) : null}

      <div className="space-y-3 border-t border-white/8 pt-3">
        <div>
          <label className="block text-[11px] font-medium text-[var(--brand-cream)]/55" htmlFor={`estado-${ev.id}`}>
            Estado
          </label>
          <select
            id={`estado-${ev.id}`}
            className="mt-1 w-full cursor-pointer rounded-xl border border-white/12 bg-[var(--panel-input)] px-2.5 py-2 text-[12px] text-[var(--brand-cream)] outline-none focus:border-[var(--brand-accent-v1)]/60"
            value={
              ESTADO_OPCIONES.some((o) => o.value === ev.estado) ? (ev.estado as TurnoEstado) : "pendiente"
            }
            onChange={(e) => onEstadoChange(e.target.value as TurnoEstado)}
          >
            {ESTADO_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[var(--brand-cream)]/55" htmlFor={`nota-${ev.id}`}>
            Nota interna
          </label>
          <textarea
            id={`nota-${ev.id}`}
            className="mt-1 min-h-[80px] w-full rounded-xl border border-white/12 bg-[var(--panel-input)] px-2.5 py-2 text-[12px] text-[var(--brand-cream)] outline-none focus:border-[var(--brand-accent-v1)]/60"
            placeholder="Nota interna…"
            value={ev.notaInterna}
            onChange={(e) => onNotaChange(e.target.value)}
            onBlur={(e) => onNotaBlur(e.target.value)}
          />
        </div>
        {guardandoId === ev.turnoId ? (
          <p className="text-[11px] text-[var(--brand-cream)]/45">Guardando…</p>
        ) : null}
      </div>
    </div>
  );
}

function buildWhatsAppLink(ev: PanelCalendarioEvento): string | null {
  const phone = normalizePhoneForWhatsApp(ev.celular);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage(ev))}`;
}

function StatusBadge({ estado }: { estado: string }) {
  if (estado === "cancelado") {
    return (
      <span className="inline-block rounded-full bg-red-500/18 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-red-200/95">
        Cancelado
      </span>
    );
  }
  if (estado === "confirmado") {
    return (
      <span className="inline-block rounded-full bg-emerald-500/16 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-emerald-200/95">
        Confirmado
      </span>
    );
  }
  if (estado === "pending_payment" || estado === "pendiente") {
    return (
      <span className="inline-block rounded-full bg-[var(--brand-ui-primary)]/20 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[var(--brand-ui-primary)]">
        Pendiente
      </span>
    );
  }
  if (estado === "expirado") {
    return (
      <span className="inline-block rounded-full bg-zinc-500/20 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-zinc-200/90">
        Expirado
      </span>
    );
  }
  if (estado === "contactado") {
    return (
      <span className="inline-block rounded-full bg-sky-500/18 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-sky-100/95">
        Contactado
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[var(--brand-cream)]/75">
      {estado}
    </span>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
      />
    </svg>
  );
}

function IconMessage({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a23.922 23.922 0 012.622 4.031 2.251 2.251 0 01-2.213 3.076 19.9 19.9 0 01-6.107-.955m-.62-8.058c.16.049.32.102.48.158M12 21.75c-2.685 0-5.173-.332-7.19-.922m15.854-2.128C19.62 16.98 18.09 15.75 16.5 15.75c-1.088 0-2.103.33-2.968.893m0 0a25.652 25.652 0 01-7.037 2.184M12 2.25c-2.625 0-4.854.463-6.709 1.21a2.25 2.25 0 00-1.616 2.16c0 1.176.94 2.163 2.068 2.928.492.29.99.559 1.516.792M12 2.25c2.625 0 4.854.463 6.709 1.21a2.25 2.25 0 011.616 2.16c0 1.176-.94 2.163-2.068 2.928a24.816 24.816 0 01-1.516.792"
      />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.125a7.5 7.5 0 0115 0"
      />
    </svg>
  );
}

export function PanelTurnosDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reprogramadoOk = searchParams.get("reprogramado") === "1";
  const creadoOk = searchParams.get("creado") === "1";
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastHandledRef = useRef(false);
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [eventos, setEventos] = useState<PanelCalendarioEvento[]>([]);
  const [agendaBlocks, setAgendaBlocks] = useState<PanelAgendaBlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [detalleEventoId, setDetalleEventoId] = useState<string | null>(null);

  const grid = useMemo(() => buildPanelMonthGrid(year, month), [year, month]);
  const todayKey = todayYmd(now);

  const [selectedKey, setSelectedKey] = useState<string>(() => {
    const key = todayYmd(now);
    const [y, m] = key.split("-").map(Number);
    if (y === now.getFullYear() && m === now.getMonth() + 1) return key;
    return `${year}-${pad2(month)}-01`;
  });

  useEffect(() => {
    const curFirst = `${year}-${pad2(month)}-01`;
    const curLast = new Date(year, month, 0).getDate();
    const curLastKey = `${year}-${pad2(month)}-${pad2(curLast)}`;
    if (selectedKey >= curFirst && selectedKey <= curLastKey) return;

    if (todayKey >= curFirst && todayKey <= curLastKey) {
      setSelectedKey(todayKey);
      return;
    }
    setSelectedKey(curFirst);
  }, [year, month, selectedKey, todayKey]);

  useEffect(() => {
    setDetalleEventoId(null);
  }, [selectedKey, year, month]);

  useEffect(() => {
    if (toastHandledRef.current) return;
    const msg = creadoOk
      ? "Turno agregado correctamente."
      : reprogramadoOk
        ? "Turno reprogramado. La agenda ya refleja el nuevo horario."
        : null;
    if (!msg) return;
    toastHandledRef.current = true;
    setToastMsg(msg);
    window.history.replaceState({}, "", "/panel-turnos");
  }, [creadoOk, reprogramadoOk]);

  useEffect(() => {
    if (!toastMsg) return;
    const hideTimer = window.setTimeout(() => {
      setToastMsg(null);
    }, 2600);
    return () => {
      window.clearTimeout(hideTimer);
    };
  }, [toastMsg]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/panel-turnos/calendario?year=${year}&month=${month}`,
          { credentials: "same-origin", cache: "no-store" },
        );
        const data = (await res.json()) as {
          eventos?: PanelCalendarioEvento[];
          agendaBlocks?: PanelAgendaBlockRow[];
          error?: string;
        };
        if (!res.ok) {
          if (res.status === 401) router.push("/panel-turnos/login");
          return;
        }
        if (alive) {
          setEventos(Array.isArray(data.eventos) ? data.eventos : []);
          setAgendaBlocks(Array.isArray(data.agendaBlocks) ? data.agendaBlocks : []);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [year, month, router, refreshTick]);

  const combinedCountsByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of eventos) {
      m.set(e.dateKey, (m.get(e.dateKey) ?? 0) + 1);
    }
    for (const cell of grid) {
      const key = cell.dateKey;
      for (const b of agendaBlocks) {
        if (agendaBlockAppliesToDateKey(b as AgendaBlockRule, key)) {
          m.set(key, (m.get(key) ?? 0) + 1);
        }
      }
    }
    return m;
  }, [eventos, agendaBlocks, grid]);

  const dayRows = useMemo(() => {
    const rows: DayRow[] = [];
    for (const e of eventos) {
      if (e.dateKey === selectedKey) rows.push({ kind: "reservation", item: e });
    }
    for (const b of agendaBlocks) {
      if (agendaBlockAppliesToDateKey(b as AgendaBlockRule, selectedKey)) {
        rows.push({ kind: "block", item: b });
      }
    }
    rows.sort((a, b) => {
      const ta = a.item.timeLocal;
      const tb = b.item.timeLocal;
      return ta.localeCompare(tb);
    });
    return rows;
  }, [eventos, agendaBlocks, selectedKey]);

  const reloadMonth = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  async function handleDeleteBlock(blockId: string) {
    if (!window.confirm("¿Eliminar este bloqueo de agenda?")) return;
    const res = await fetch(`/api/panel-turnos/agenda-blocks?id=${encodeURIComponent(blockId)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!res.ok) return;
    reloadMonth();
  }

  async function handleLogout() {
    setLogoutBusy(true);
    try {
      await fetch("/api/panel-auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      setLogoutBusy(false);
      router.push("/panel-turnos/login");
      router.refresh();
    }
  }

  function patchEventosLocal(turnoId: string, patch: Partial<Pick<PanelCalendarioEvento, "estado" | "notaInterna">>) {
    setEventos((prev) => prev.map((e) => (e.turnoId === turnoId ? { ...e, ...patch } : e)));
  }

  async function actualizarEstado(turnoId: string, estado: TurnoEstado) {
    patchEventosLocal(turnoId, { estado });
    setGuardandoId(turnoId);
    try {
      const response = await fetch(`/api/turnos/${turnoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
        credentials: "same-origin",
      });
      if (!response.ok) reloadMonth();
    } catch {
      reloadMonth();
    } finally {
      setGuardandoId(null);
    }
  }

  async function guardarNota(turnoId: string, notaInterna: string) {
    setGuardandoId(turnoId);
    try {
      const response = await fetch(`/api/turnos/${turnoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notaInterna }),
        credentials: "same-origin",
      });
      if (!response.ok) reloadMonth();
    } catch {
      reloadMonth();
    } finally {
      setGuardandoId(null);
    }
  }

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
      return;
    }
    setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
      return;
    }
    setMonth((m) => m + 1);
  }

  return (
    <div className="min-h-screen bg-[var(--panel-bg)] pb-24 text-[var(--brand-cream)]/92">
      {toastMsg ? (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
          <div
            role="status"
            className="rounded-2xl border border-emerald-400/40 bg-emerald-950/90 px-4 py-3 text-center text-[14px] font-semibold leading-snug text-emerald-100 shadow-[0_16px_40px_rgba(6,78,59,0.35)]"
          >
            {toastMsg}
          </div>
        </div>
      ) : null}
      <div className="mx-auto max-w-md px-4 font-medium">
        <header className="flex items-start justify-between gap-4 pt-6 pb-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-accent-v2)] to-[var(--brand-accent-v1)] shadow-[0_10px_28px_rgba(165,106,66,0.35)]">
              <IconSparkles className="h-6 w-6 text-[var(--panel-bg)]" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold leading-tight text-[var(--brand-cream)]/96">Karün · Wanda</h1>
              <p className="text-[13px] leading-relaxed text-[var(--brand-cream)]/78">Panel de turnos</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/panel-turnos/bloqueo"
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-[var(--brand-ui-primary)]/40 bg-[var(--panel-surface)] text-[var(--brand-ui-primary)] shadow-[0_6px_22px_rgba(0,0,0,0.35)] hover:bg-[var(--panel-surface-hover)]"
              aria-label="Bloquear franja de agenda"
            >
              <IconLock className="h-5 w-5" />
            </Link>
            <Link
              href="/panel-turnos/nuevo"
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-[var(--brand-accent-v1)]/40 bg-[var(--panel-surface)] text-[var(--brand-accent-v1)] shadow-[0_6px_22px_rgba(0,0,0,0.35)] hover:bg-[var(--panel-surface-hover)]"
              aria-label="Agregar turno"
            >
              <IconPlus className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <section className="mt-5 rounded-[28px] border border-white/14 bg-[var(--panel-surface)] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
          <div className="relative mb-3 flex items-center justify-center px-10">
            <button
              type="button"
              onClick={prevMonth}
              className="absolute left-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-[var(--brand-cream)]/70 hover:bg-white/5 hover:text-[var(--brand-cream)]"
              aria-label="Mes anterior"
            >
              <IconChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-center text-[18px] font-bold capitalize tracking-tight text-[var(--brand-cream)]/98">
              {panelMonthTitle(year, month)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="absolute right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-[var(--brand-cream)]/70 hover:bg-white/5 hover:text-[var(--brand-cream)]"
              aria-label="Mes siguiente"
            >
              <IconChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center text-[12px] font-bold tracking-wide text-[var(--brand-cream)]/74">
            {PANEL_WEEK_LETTERS.map((L) => (
              <div key={L} className="py-2">
                {L}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 text-center">
            {grid.map((cell) => {
              const sel = cell.dateKey === selectedKey;
              const count = combinedCountsByDay.get(cell.dateKey) ?? 0;
              const inMonth = cell.inMonth;

              return (
                <button
                  key={`${cell.dateKey}-${cell.inMonth}-${cell.day}`}
                  type="button"
                  onClick={() => setSelectedKey(cell.dateKey)}
                  className="flex w-full cursor-pointer flex-col items-center py-1"
                >
                  <span
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-full text-[17px] font-bold leading-none transition",
                      inMonth ? "text-[var(--brand-cream)]/96" : "text-[var(--brand-cream)]/38",
                      sel
                        ? "bg-gradient-to-br from-[var(--brand-accent-v2)] to-[var(--brand-accent-v1)] text-[var(--panel-bg)] shadow-[0_8px_24px_rgba(165,106,66,0.35)]"
                        : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    {cell.day}
                  </span>
                  <span className="mt-0.5 flex h-2 items-center justify-center">
                    {count > 0 ? (
                      <span className="block h-1.5 w-1.5 rounded-full bg-[var(--brand-accent-v1)]" />
                    ) : (
                      <span className="block h-1.5 w-1.5 rounded-full bg-transparent" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[34px] font-extrabold leading-tight tracking-tight text-[var(--brand-cream)]/95">
              {weekdayLongFromKey(selectedKey)}
            </p>
            <p className="mt-0.5 text-[18px] font-semibold text-[var(--brand-cream)]/78">{dayLongFromKey(selectedKey)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/16 bg-[var(--panel-surface)] px-3.5 py-2 text-[14px] text-[var(--brand-cream)]/95">
            <IconCalendar className="h-4.5 w-4.5 text-[var(--brand-accent-v1)]" />
            <span className="font-semibold text-[var(--brand-cream)]/92">
              {dayRows.length} {dayRows.length === 1 ? "evento" : "eventos"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {loading ? (
            <p className="py-10 text-center text-[14px] text-[var(--brand-cream)]/55">Cargando agenda…</p>
          ) : dayRows.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-[var(--brand-cream)]/55">
              No hay turnos ni bloqueos este día.
            </p>
          ) : (
            dayRows.map((row) => {
              if (row.kind === "block") {
                const b = row.item;
                const weekly = b.recurrence?.type === "weekly";
                return (
                  <article
                    key={`block-${b.id}`}
                    className="rounded-[20px] border border-[var(--brand-ui-primary)]/42 bg-[var(--panel-surface)] px-4 py-4 shadow-[0_10px_32px_rgba(0,0,0,0.32)]"
                  >
                    <div className="flex gap-3">
                      <div className="w-[58px] shrink-0 text-left">
                        <p className="text-[17px] font-extrabold leading-none text-[var(--brand-ui-primary)]">{b.timeLocal}</p>
                        <p className="mt-2 text-[12px] font-semibold leading-none text-[var(--brand-cream)]/72">{b.durationMinutes} min</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex gap-2">
                          <IconLock className="h-5 w-5 shrink-0 text-[var(--brand-ui-primary)]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[17px] font-bold leading-snug text-[var(--brand-cream)]/96">Bloqueo de agenda</p>
                            <p className="mt-1 text-[13px] font-medium text-[var(--brand-cream)]/80">{scopeLabel(b.scope)}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="inline-block rounded-full bg-[var(--brand-ui-primary)]/24 px-3 py-1 text-[12px] font-bold tracking-wide text-[var(--brand-ui-primary)]">
                                Bloqueo
                              </span>
                              {weekly ? (
                                <span className="inline-block rounded-full bg-white/12 px-3 py-1 text-[12px] font-semibold text-[var(--brand-cream)]/88">
                                  Semanal
                                  {b.recurrence?.untilDateKey ? ` hasta ${b.recurrence.untilDateKey}` : ""}
                                </span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => void handleDeleteBlock(b.id)}
                                className="cursor-pointer text-[12px] font-bold text-red-300/95 underline-offset-2 hover:underline"
                              >
                                Eliminar
                              </button>
                            </div>
                            {b.notes ? (
                              <p className="mt-2 text-[13px] leading-snug text-[var(--brand-cream)]/78">{b.notes}</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }

              const ev = row.item;
              const waUrl = buildWhatsAppLink(ev);
              const detalleAbierto = detalleEventoId === ev.id;
              const resumenLinea = panelResumenVisible(ev);
              return (
                <article
                  key={ev.id}
                  className="rounded-[20px] border border-white/18 bg-[var(--panel-surface)] px-4 py-4 shadow-[0_10px_32px_rgba(0,0,0,0.32)]"
                >
                  <div className="flex gap-3">
                    <div className="w-[58px] shrink-0 text-left">
                      <p className="text-[18px] font-bold leading-none text-[var(--brand-cream)]/94">{ev.timeLocal}</p>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-[17px] font-bold leading-snug text-[var(--brand-cream)]/95">{ev.titulo}</p>
                      <p className="flex items-center gap-1.5 text-[15px] font-semibold leading-tight text-[var(--brand-cream)]/90">
                        <IconUser className="h-4 w-4 shrink-0 text-[var(--brand-cream)]/60" />
                        <span className="truncate">{ev.nombre || "Cliente"}</span>
                      </p>
                      {resumenLinea ? (
                        <p className="text-[13px] font-medium leading-snug text-[var(--brand-cream)]/72">{resumenLinea}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setDetalleEventoId((id) => (id === ev.id ? null : ev.id))}
                          className="cursor-pointer rounded-full border border-sky-400/50 bg-sky-500/20 px-3 py-1.5 text-[12px] font-bold text-sky-100 ring-1 ring-sky-400/40 transition hover:bg-sky-500/30"
                        >
                          {detalleAbierto ? "Cerrar" : "Detalle"}
                        </button>
                        <StatusBadge estado={ev.estado} />
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#25D366]/16 px-3 py-1.5 text-[12px] font-bold text-[#6ee7a5] ring-1 ring-[#25D366]/40 transition hover:bg-[#25D366]/24"
                          >
                            <IconMessage className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        ) : null}
                        {/* Reprogramar deshabilitado por ahora
                        {canReprogramConsultaIndividual(ev) ? (
                          <Link
                            href={`/panel-turnos/reprogramar/${ev.turnoId}`}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--brand-accent-v1)]/55 bg-[var(--brand-accent-v1)]/14 px-3 py-1.5 text-[12px] font-bold text-[var(--brand-accent-v1)] ring-1 ring-[var(--brand-accent-v1)]/35 transition hover:bg-[var(--brand-accent-v1)]/24"
                          >
                            Reprogramar
                          </Link>
                        ) : null}
                        */}
                      </div>

                      {detalleAbierto ? (
                        <PanelTurnoDetalleExpand
                          ev={ev}
                          guardandoId={guardandoId}
                          onEstadoChange={(estado) => void actualizarEstado(ev.turnoId, estado)}
                          onNotaChange={(v) => {
                            setEventos((prev) =>
                              prev.map((x) => (x.turnoId === ev.turnoId ? { ...x, notaInterna: v } : x)),
                            );
                          }}
                          onNotaBlur={(v) => void guardarNota(ev.turnoId, v)}
                        />
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={logoutBusy}
            className="cursor-pointer text-[13px] text-[var(--brand-cream)]/50 underline-offset-4 hover:text-[var(--brand-accent-v1)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cerrar sesión del panel
          </button>
        </div>
      </div>
    </div>
  );
}
