"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Lock, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PanelBlockCard } from "../../components/panel/panel-block-card";
import { PanelTurnoCard } from "../../components/panel/panel-turno-card";
import {
  panelCard,
  panelChip,
  panelContainer,
  panelDayDefault,
  panelDayOutside,
  panelActionBtn,
  panelDaySelected,
  panelPage,
  panelPageBg,
  panelSecondaryBtn,
} from "../../components/panel/panel-ui";
import {
  agendaBlockAppliesToDateKey,
  type AgendaBlockRule,
} from "../../lib/booking/agenda-blocks-shared";
import {
  PANEL_WEEK_LETTERS,
  buildPanelMonthGrid,
  panelMonthTitle,
} from "../../lib/booking/panel-month-grid";
import { pickScrollToTurnoId } from "../../lib/booking/panel-now-focus";
import type { PanelAgendaBlockRow, TurnoEstado } from "../../lib/panel/panel-turno-helpers";
import { buildWhatsAppLink } from "../../lib/panel/panel-turno-helpers";
import type { PanelCalendarioEvento } from "../../lib/turnos/panel-events";
import type {
  PanelTallerEventoResumen,
  PanelTallerInscripcionesResumen,
} from "../../lib/taller/panel-taller-inscripciones";

type DayRow =
  | { kind: "reservation"; item: PanelCalendarioEvento }
  | { kind: "block"; item: PanelAgendaBlockRow };

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
  const [showCancelled, setShowCancelled] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [cancelConfirmTurnoId, setCancelConfirmTurnoId] = useState<string | null>(null);
  const [cancellingTurnoId, setCancellingTurnoId] = useState<string | null>(null);
  const [tallerResumen, setTallerResumen] = useState<{
    evento: PanelTallerEventoResumen;
    resumen: PanelTallerInscripcionesResumen;
  } | null>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

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
    const hideTimer = window.setTimeout(() => setToastMsg(null), 2600);
    return () => window.clearTimeout(hideTimer);
  }, [toastMsg]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/panel-turnos/calendario?year=${year}&month=${month}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = (await res.json()) as {
          eventos?: PanelCalendarioEvento[];
          agendaBlocks?: PanelAgendaBlockRow[];
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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/panel-turnos/taller-inscripciones?countsOnly=1", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = (await res.json()) as {
          evento?: PanelTallerEventoResumen;
          resumen?: PanelTallerInscripcionesResumen;
        };
        if (!res.ok || !alive) return;
        if (data.evento && data.resumen) {
          setTallerResumen({ evento: data.evento, resumen: data.resumen });
        }
      } catch {
        /* resumen opcional en dashboard */
      }
    })();
    return () => {
      alive = false;
    };
  }, [refreshTick]);

  const visibleEventos = useMemo(() => {
    if (showCancelled) return eventos;
    return eventos.filter((e) => e.estado !== "cancelado");
  }, [eventos, showCancelled]);

  const combinedCountsByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of visibleEventos) {
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
  }, [visibleEventos, agendaBlocks, grid]);

  const cancelledCountSelectedDay = useMemo(
    () => eventos.filter((e) => e.dateKey === selectedKey && e.estado === "cancelado").length,
    [eventos, selectedKey],
  );

  const dayRows = useMemo(() => {
    const rows: DayRow[] = [];
    for (const e of visibleEventos) {
      if (e.dateKey === selectedKey) rows.push({ kind: "reservation", item: e });
    }
    for (const b of agendaBlocks) {
      if (agendaBlockAppliesToDateKey(b as AgendaBlockRule, selectedKey)) {
        rows.push({ kind: "block", item: b });
      }
    }
    rows.sort((a, b) => a.item.timeLocal.localeCompare(b.item.timeLocal));
    return rows;
  }, [visibleEventos, agendaBlocks, selectedKey]);

  const scrollTargetId = useMemo(() => {
    const dayEventos = visibleEventos.filter((e) => e.dateKey === selectedKey);
    return pickScrollToTurnoId(dayEventos, selectedKey);
  }, [visibleEventos, selectedKey, clockTick]);

  useEffect(() => {
    const id = window.setInterval(() => setClockTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (loading || !scrollTargetId) return;
    const el = cardRefs.current[scrollTargetId];
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [scrollTargetId, loading, dayRows.length, selectedKey]);

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

  async function handleCancelTurno(turnoId: string) {
    setCancellingTurnoId(turnoId);
    try {
      await actualizarEstado(turnoId, "cancelado");
    } finally {
      setCancellingTurnoId(null);
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
    <div className={`${panelPage} ${panelPageBg}`}>
      {toastMsg ? (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4">
          <div
            role="status"
            className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-center text-[14px] font-semibold leading-snug text-emerald-800 shadow-lg"
          >
            {toastMsg}
          </div>
        </div>
      ) : null}

      <div className={`${panelContainer} pt-6`}>
        <header className="pb-2">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-gray-500">Panel</p>
            <h1 className="font-montserrat text-[22px] font-bold leading-tight text-gray-900">Agenda de turnos</h1>
            <p className="mt-1 text-[14px] text-gray-500">Karün · Wanda Perrin</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href="/panel-turnos/nuevo" className={panelActionBtn}>
              <Plus className="h-5 w-5" strokeWidth={2.2} />
              Agregar turno
            </Link>
            <Link href="/panel-turnos/bloqueo" className={panelSecondaryBtn}>
              <Lock className="h-5 w-5" strokeWidth={2.2} />
              Bloquear horario
            </Link>
          </div>
        </header>

        {tallerResumen ? (
          <section className={`mt-4 ${panelCard} p-4`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-montserrat text-[15px] font-semibold leading-snug text-gray-900">
                Taller {tallerResumen.evento.fechaCorta} — {tallerResumen.resumen.confirmados} confirmados ·{" "}
                {tallerResumen.resumen.pendientes}{" "}
                {tallerResumen.resumen.pendientes === 1 ? "pendiente" : "pendientes"}
              </p>
              <Link
                href="/panel-turnos/taller"
                className={`${panelSecondaryBtn} h-10 shrink-0 px-4 sm:w-auto`}
              >
                Ver inscriptos
                <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
              </Link>
            </div>
          </section>
        ) : null}

        <section className={`mt-5 ${panelCard} p-4`}>
          <div className="relative mb-3 flex items-center justify-center px-10">
            <button
              type="button"
              onClick={prevMonth}
              className="absolute left-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-center text-[15px] font-semibold capitalize tracking-tight text-gray-900">
              {panelMonthTitle(year, month)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="absolute right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold tracking-wide text-gray-400">
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
                      "flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-semibold leading-none transition",
                      inMonth ? panelDayDefault : panelDayOutside,
                      sel ? panelDaySelected : "",
                    ].join(" ")}
                  >
                    {cell.day}
                  </span>
                  <span className="mt-0.5 flex h-2 items-center justify-center">
                    {count > 0 ? (
                      <span className="block h-1.5 w-1.5 rounded-full bg-[#B88E2F]" />
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
            <p className="font-montserrat text-[22px] font-bold leading-tight tracking-tight text-gray-900">
              {weekdayLongFromKey(selectedKey)}
            </p>
            <p className="mt-0.5 text-[14px] text-gray-500">{dayLongFromKey(selectedKey)}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setShowCancelled((v) => !v)}
              className={[
                "flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-[13px] transition",
                showCancelled
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
              ].join(" ")}
              aria-pressed={showCancelled}
              aria-label={showCancelled ? "Ocultar canceladas" : "Mostrar canceladas"}
            >
              <span className="font-semibold">{cancelledCountSelectedDay}</span>
              <span className="font-semibold">
                {cancelledCountSelectedDay === 1 ? "Cancelada" : "Canceladas"}
              </span>
            </button>
            <div className={panelChip}>
              <CalendarDays className="h-4 w-4 text-[#B88E2F]" strokeWidth={1.75} />
              <span className="font-semibold">
                {dayRows.length} {dayRows.length === 1 ? "evento" : "eventos"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {loading ? (
            <p className="py-10 text-center text-[14px] text-gray-500">Cargando agenda…</p>
          ) : dayRows.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-gray-500">
              No hay turnos ni bloqueos este día.
            </p>
          ) : (
            dayRows.map((row) => {
              if (row.kind === "block") {
                return (
                  <PanelBlockCard
                    key={`block-${row.item.id}`}
                    block={row.item}
                    selectedDateKey={selectedKey}
                    onDelete={() => void handleDeleteBlock(row.item.id)}
                  />
                );
              }

              const ev = row.item;
              return (
                <PanelTurnoCard
                  key={ev.id}
                  ref={(el) => {
                    cardRefs.current[ev.id] = el;
                  }}
                  ev={ev}
                  selectedDateKey={selectedKey}
                  whatsAppUrl={buildWhatsAppLink(ev)}
                  guardandoId={guardandoId}
                  onRequestCancel={() => setCancelConfirmTurnoId(ev.turnoId)}
                  cancelDisabled={cancellingTurnoId === ev.turnoId}
                  onEstadoChange={(estado) => void actualizarEstado(ev.turnoId, estado)}
                  onNotaChange={(v) => {
                    setEventos((prev) =>
                      prev.map((x) => (x.turnoId === ev.turnoId ? { ...x, notaInterna: v } : x)),
                    );
                  }}
                  onNotaBlur={(v) => void guardarNota(ev.turnoId, v)}
                />
              );
            })
          )}
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={logoutBusy}
            className="cursor-pointer text-[13px] text-gray-400 underline-offset-4 hover:text-[#B88E2F] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cerrar sesión del panel
          </button>
        </div>
      </div>

      {cancelConfirmTurnoId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            if (cancellingTurnoId !== cancelConfirmTurnoId) setCancelConfirmTurnoId(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-montserrat text-[20px] font-bold text-gray-900">Cancelar turno</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
              ¿Estás seguro que deseás cancelar este turno? Se cancelará el turno completo (todas sus
              citas).
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelConfirmTurnoId(null)}
                disabled={cancellingTurnoId === cancelConfirmTurnoId}
                className="inline-flex h-9 items-center rounded-xl border border-gray-200 px-3 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = cancelConfirmTurnoId;
                  if (!id) return;
                  await handleCancelTurno(id);
                  setCancelConfirmTurnoId(null);
                }}
                disabled={cancellingTurnoId === cancelConfirmTurnoId}
                className="inline-flex h-9 items-center rounded-xl border border-red-200 bg-red-50 px-3 text-[12px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
              >
                {cancellingTurnoId === cancelConfirmTurnoId ? "Cancelando…" : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
