"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PANEL_WEEK_LETTERS,
  buildPanelMonthGrid,
  panelMonthTitle,
} from "../../../lib/booking/panel-month-grid";

const HORARIOS_GRUPAL = [
  { value: "grupal_930", label: "Martes y Jueves - 9:30H" },
  { value: "grupal_1030", label: "Martes y Jueves - 10:30H" },
  { value: "grupal_16", label: "Martes y Jueves - 16:00H" },
  { value: "grupal_17", label: "Martes y Jueves - 17:00H" },
] as const;

const HORARIOS_CONSULTA_INDIVIDUAL = [
  { value: "09:00", label: "09:00" },
  { value: "10:00", label: "10:00" },
  { value: "16:00", label: "16:00" },
  { value: "17:00", label: "17:00" },
] as const;

const iconChevronDown = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

type GrupalBloqueoRow = {
  id: string;
  horarioId: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

type AgendaBloqueoRow = {
  id: string;
  anchorDateKey: string;
  timeLocal: string;
  durationMinutes: number;
  recurrence: { type: "weekly"; untilDateKey?: string | null } | null;
  notes?: string | null;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDateKeyToYearMonth(dateKey: string): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!m) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  return { year: Number(m[1]), month: Number(m[2]) };
}

function formatDateLabel(dateKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!m) return "Elegir fecha";
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(dt);
  const w = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${w} ${m[3]}/${m[2]}/${m[1]}`;
}

function isConsultaIndividualWeekday(dateKey: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!m) return false;
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const wd = dt.getDay();
  return wd === 1 || wd === 3 || wd === 5; // lun, mie, vie
}

function consultaIndividualHoursForDate(dateKey: string): string[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!m) return [];
  const wd = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getDay();
  if (wd === 1) return ["16:00", "17:00"]; // lunes
  if (wd === 3) return ["09:00", "10:00", "16:00", "17:00"]; // miercoles
  if (wd === 5) return ["09:00", "10:00"]; // viernes
  return [];
}

export function PanelBloqueoClient() {
  const [anchorDateKey, setAnchorDateKey] = useState("");
  const [timeLocal, setTimeLocal] = useState("");
  const recurrenceType: "once" = "once";
  const untilDateKey = "";
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [grupalRows, setGrupalRows] = useState<GrupalBloqueoRow[]>([]);
  const [agendaRows, setAgendaRows] = useState<AgendaBloqueoRow[]>([]);
  const [grupalHorario, setGrupalHorario] = useState<string>("");
  const [grupalNota, setGrupalNota] = useState("");
  const [grupalBusy, setGrupalBusy] = useState(false);
  const [grupalMsg, setGrupalMsg] = useState<string | null>(null);
  const [mostrarNotaGrupal, setMostrarNotaGrupal] = useState(false);
  const [mostrarAgendaAvanzada, setMostrarAgendaAvanzada] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const initialDate = useMemo(() => parseDateKeyToYearMonth(anchorDateKey), [anchorDateKey]);
  const [calYear, setCalYear] = useState(initialDate.year);
  const [calMonth, setCalMonth] = useState(initialDate.month);
  const calendarWrapRef = useRef<HTMLDivElement>(null);
  const consultaIndividualSectionRef = useRef<HTMLElement>(null);

  const bloqueadosSet = useMemo(
    () => new Set(grupalRows.map((r) => r.horarioId)),
    [grupalRows],
  );
  const franjasCerradas = useMemo(
    () => HORARIOS_GRUPAL.filter((h) => bloqueadosSet.has(h.value)),
    [bloqueadosSet],
  );
  const bloqueosActivosTotal = franjasCerradas.length + agendaRows.length;
  const calendarGrid = useMemo(() => buildPanelMonthGrid(calYear, calMonth), [calYear, calMonth]);
  const horasConsultaDia = useMemo(
    () => consultaIndividualHoursForDate(anchorDateKey),
    [anchorDateKey],
  );
  const opcionesHoraConsulta = useMemo(() => {
    const allowed = new Set(horasConsultaDia);
    return HORARIOS_CONSULTA_INDIVIDUAL.filter((h) => allowed.has(h.value));
  }, [horasConsultaDia]);

  async function loadGrupalBloqueos() {
    try {
      const res = await fetch("/api/panel-turnos/grupal-bloqueos", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as { bloqueos?: GrupalBloqueoRow[] };
      if (!res.ok) return;
      setGrupalRows(Array.isArray(data.bloqueos) ? data.bloqueos : []);
    } catch {
      /* ignore */
    }
  }

  async function loadAgendaBloqueos() {
    try {
      const res = await fetch("/api/panel-turnos/agenda-blocks", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as { blocks?: AgendaBloqueoRow[] };
      if (!res.ok) return;
      const rows = Array.isArray(data.blocks) ? data.blocks : [];
      setAgendaRows(rows);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void loadGrupalBloqueos();
    void loadAgendaBloqueos();
  }, []);

  useEffect(() => {
    if (!calendarOpen) return;
    function onOutsideClick(e: MouseEvent) {
      if (calendarWrapRef.current && !calendarWrapRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [calendarOpen]);

  useEffect(() => {
    if (!mostrarAgendaAvanzada) return;
    const doScroll = () => {
      const scroller = document.scrollingElement ?? document.documentElement;
      const maxTop = Math.max(
        scroller.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );
      window.scrollTo({ top: maxTop, behavior: "smooth" });
    };
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(doScroll);
    });
    const t = window.setTimeout(doScroll, 140);
    return () => window.clearTimeout(t);
  }, [mostrarAgendaAvanzada]);

  useEffect(() => {
    if (!timeLocal) return;
    if (opcionesHoraConsulta.some((h) => h.value === timeLocal)) return;
    setTimeLocal("");
  }, [opcionesHoraConsulta, timeLocal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/panel-turnos/agenda-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anchorDateKey,
          timeLocal,
          durationMinutes: 60,
          recurrenceType,
          untilDateKey: null,
          notes: notes.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "No se pudo guardar.");
        return;
      }
      setMsg("Bloqueo creado.");
      setNotes("");
      await loadAgendaBloqueos();
    } catch {
      setMsg("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  async function bloquearFranjaGrupal(e: React.FormEvent) {
    e.preventDefault();
    setGrupalMsg(null);
    setGrupalBusy(true);
    try {
      const res = await fetch("/api/panel-turnos/grupal-bloqueos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          horarioId: grupalHorario,
          note: grupalNota.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setGrupalMsg(data.error ?? "No se pudo guardar.");
        return;
      }
      setGrupalMsg("Franja grupal bloqueada.");
      setGrupalNota("");
      setMostrarNotaGrupal(false);
      await loadGrupalBloqueos();
    } catch {
      setGrupalMsg("Error de red.");
    } finally {
      setGrupalBusy(false);
    }
  }

  function toggleCalendar() {
    if (calendarOpen) {
      setCalendarOpen(false);
      return;
    }
    const { year, month } = parseDateKeyToYearMonth(anchorDateKey);
    setCalYear(year);
    setCalMonth(month);
    setCalendarOpen(true);
  }

  function prevCalMonth() {
    if (calMonth === 1) {
      setCalMonth(12);
      setCalYear((y) => y - 1);
      return;
    }
    setCalMonth((m) => m - 1);
  }

  function nextCalMonth() {
    if (calMonth === 12) {
      setCalMonth(1);
      setCalYear((y) => y + 1);
      return;
    }
    setCalMonth((m) => m + 1);
  }

  async function desbloquearFranjaGrupal(horarioId: string) {
    setGrupalMsg(null);
    setGrupalBusy(true);
    try {
      const res = await fetch(
        `/api/panel-turnos/grupal-bloqueos?horarioId=${encodeURIComponent(horarioId)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setGrupalMsg(data.error ?? "No se pudo eliminar.");
        return;
      }
      setGrupalMsg("Franja grupal desbloqueada.");
      await loadGrupalBloqueos();
    } catch {
      setGrupalMsg("Error de red.");
    } finally {
      setGrupalBusy(false);
    }
  }

  async function desbloquearBloqueoAgenda(blockId: string) {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/panel-turnos/agenda-blocks?id=${encodeURIComponent(blockId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "No se pudo eliminar.");
        return;
      }
      setMsg("Horario reabierto.");
      await loadAgendaBloqueos();
    } catch {
      setMsg("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section
        ref={consultaIndividualSectionRef}
        className="rounded-[28px] border border-white/10 bg-[var(--panel-surface)] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.38)]"
      >
        <h1 className="text-lg font-semibold text-[var(--brand-accent-v1)]">Gestionar cupo grupal</h1>
        <p className="mt-1 text-xs text-[var(--brand-cream)]/55">
          Cerrá una franja cuando ya no quieras tomar más reservas web.
        </p>
        <form className="mt-4 flex flex-col gap-3" onSubmit={bloquearFranjaGrupal}>
          <div className="relative mt-1">
            <select
              value={grupalHorario}
              onChange={(e) => setGrupalHorario(e.target.value)}
              className={`w-full appearance-none rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none ${
                grupalHorario ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"
              }`}
            >
              <option value="" disabled hidden>
                Elegir franja grupal
              </option>
              {HORARIOS_GRUPAL.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-cream)]/65">
              {iconChevronDown}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMostrarNotaGrupal((v) => !v)}
            className="w-fit text-xs font-medium text-[var(--brand-cream)]/70 underline-offset-2 hover:underline"
          >
            {mostrarNotaGrupal ? "Ocultar nota interna" : "Agregar nota interna (opcional)"}
          </button>
          {mostrarNotaGrupal ? (
            <label className="text-xs font-medium text-[var(--brand-cream)]/70">
              Nota interna
              <textarea
                value={grupalNota}
                onChange={(e) => setGrupalNota(e.target.value)}
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none"
                placeholder="Ej: cupo completo por pacientes regulares"
              />
            </label>
          ) : null}
          <button
            type="submit"
            disabled={grupalBusy || !grupalHorario}
            className="mt-2 rounded-2xl bg-gradient-to-br from-[var(--brand-ui-primary)] to-[var(--brand-accent-v1)] py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
          >
            {grupalBusy ? "Guardando…" : "Cerrar franja"}
          </button>
          {grupalMsg && <p className="text-center text-xs text-[var(--brand-cream)]/80">{grupalMsg}</p>}
        </form>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[var(--panel-surface)] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
        <h2 className="text-base font-semibold text-[var(--brand-accent-v1)]">
          Bloqueos activos ({bloqueosActivosTotal})
        </h2>
        <p className="mt-2 text-xs text-[var(--brand-cream)]/60">
          Revisá y reabrí bloqueos de grupal o de consulta individual.
        </p>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-3.5">
          <h3 className="text-sm font-semibold text-[var(--brand-cream)]/95">
            Franjas grupales cerradas ({franjasCerradas.length})
          </h3>
          <p className="mt-1 text-[11px] text-[var(--brand-cream)]/55">
            Cierres por cupo manual de clases grupales.
          </p>
          {franjasCerradas.length === 0 ? (
            <p className="mt-3 text-xs text-[var(--brand-cream)]/60">No hay franjas grupales cerradas.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {franjasCerradas.map((h) => {
                const row = grupalRows.find((r) => r.horarioId === h.value);
                return (
                  <div
                    key={h.value}
                    className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-[var(--panel-input)] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--brand-cream)]">{h.label}</p>
                      <p className="text-xs text-[var(--brand-cream)]/65">Cerrada</p>
                      {row?.note ? <p className="mt-1 text-xs text-[var(--brand-cream)]/55">{row.note}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => void desbloquearFranjaGrupal(h.value)}
                      disabled={grupalBusy}
                      className="shrink-0 rounded-xl border border-red-300/45 px-2.5 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-50"
                    >
                      Reabrir
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-3.5">
          <h3 className="text-sm font-semibold text-[var(--brand-cream)]/95">
            Consulta individual bloqueada ({agendaRows.length})
          </h3>
          <p className="mt-1 text-[11px] text-[var(--brand-cream)]/55">
            Bloqueos puntuales de agenda para consulta individual.
          </p>
          {agendaRows.length === 0 ? (
            <p className="mt-3 text-xs text-[var(--brand-cream)]/60">No hay horarios bloqueados.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {agendaRows.map((b) => (
                <div
                  key={b.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-[var(--panel-input)] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--brand-cream)]">
                      {formatDateLabel(b.anchorDateKey)} · {b.timeLocal}
                    </p>
                    <p className="text-xs text-[var(--brand-cream)]/65">
                      {b.durationMinutes} min
                      {b.recurrence?.type === "weekly"
                        ? ` · semanal${b.recurrence.untilDateKey ? ` hasta ${b.recurrence.untilDateKey}` : ""}`
                        : ""}
                    </p>
                    {b.notes ? <p className="mt-1 text-xs text-[var(--brand-cream)]/55">{b.notes}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => void desbloquearBloqueoAgenda(b.id)}
                    disabled={busy}
                    className="shrink-0 rounded-xl border border-red-300/45 px-2.5 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-50"
                  >
                    Reabrir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[var(--panel-surface)] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
        <button
          type="button"
          onClick={() => setMostrarAgendaAvanzada((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-base font-semibold text-[var(--brand-accent-v1)]">Consulta individual</span>
          <span className="text-xs text-[var(--brand-cream)]/65">
            {mostrarAgendaAvanzada ? "Ocultar" : "Bloquear horario puntual"}
          </span>
        </button>
        {mostrarAgendaAvanzada ? (
          <form className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4" onSubmit={handleSubmit}>
            <div ref={calendarWrapRef} className="relative">
              <button
                type="button"
                onClick={toggleCalendar}
                className="mt-1 flex w-full items-center justify-between rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none"
              >
                <span className={anchorDateKey ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"}>
                  {anchorDateKey ? formatDateLabel(anchorDateKey) : "Elegir fecha"}
                </span>
                <span className="text-xs text-[var(--brand-cream)]/60">{calendarOpen ? "Cerrar" : null}</span>
              </button>
              {calendarOpen ? (
                <div className="absolute z-20 mt-2 w-full rounded-2xl border border-white/10 bg-[var(--panel-surface)] p-3 shadow-[0_14px_30px_rgba(0,0,0,0.45)]">
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={prevCalMonth}
                      className="rounded-lg px-2 py-1 text-sm text-[var(--brand-cream)]/70 hover:bg-white/5"
                      aria-label="Mes anterior"
                    >
                      {"<"}
                    </button>
                    <span className="text-sm font-semibold text-[var(--brand-cream)]/90 capitalize">
                      {panelMonthTitle(calYear, calMonth)}
                    </span>
                    <button
                      type="button"
                      onClick={nextCalMonth}
                      className="rounded-lg px-2 py-1 text-sm text-[var(--brand-cream)]/70 hover:bg-white/5"
                      aria-label="Mes siguiente"
                    >
                      {">"}
                    </button>
                  </div>
                  <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-[var(--brand-cream)]/55">
                    {PANEL_WEEK_LETTERS.map((letter) => (
                      <div key={letter} className="py-1">
                        {letter}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-y-1 text-center">
                    {calendarGrid.map((cell) => {
                      const selected = cell.dateKey === anchorDateKey;
                      const selectable = cell.inMonth && isConsultaIndividualWeekday(cell.dateKey);
                      return (
                        <button
                          key={`${cell.dateKey}-${cell.day}-${cell.inMonth}`}
                          type="button"
                          disabled={!selectable}
                          onClick={() => {
                            if (!selectable) return;
                            setAnchorDateKey(cell.dateKey);
                            setCalendarOpen(false);
                          }}
                          className="flex w-full items-center justify-center py-1 disabled:cursor-not-allowed"
                        >
                          <span
                            className={[
                              "flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold",
                              cell.inMonth ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/30",
                              !selectable
                                ? "opacity-35"
                                : selected
                                  ? "bg-[var(--brand-ui-primary)] text-black"
                                  : "hover:bg-white/5",
                            ].join(" ")}
                          >
                            {cell.day}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="relative mt-1">
              <select
                value={timeLocal}
                onChange={(e) => setTimeLocal(e.target.value.trim())}
                className={`w-full appearance-none rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none focus:border-[var(--brand-ui-primary)] ${
                  timeLocal ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"
                }`}
              >
                <option value="" disabled hidden>
                  Elegir horario
                </option>
                {opcionesHoraConsulta.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-cream)]/65">
                {iconChevronDown}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Nota interna"
              className="mt-1 w-full resize-none rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none"
            />
            <button
              type="submit"
              disabled={busy || opcionesHoraConsulta.length === 0 || !timeLocal}
              className="mt-2 rounded-2xl bg-gradient-to-br from-[var(--brand-ui-primary)] to-[var(--brand-accent-v1)] py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {busy ? "Guardando…" : "Bloquear horario"}
            </button>
            {msg && <p className="text-center text-xs text-[var(--brand-cream)]/80">{msg}</p>}
          </form>
        ) : null}
      </section>
    </div>
  );
}
