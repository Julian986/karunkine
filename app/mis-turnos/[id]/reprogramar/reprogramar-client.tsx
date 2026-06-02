"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { isHorarioIndividualId } from "../../../../lib/turnos/wanda-schedule";

export type ReprogramarVariant = "customer" | "panel";

type TurnoDetail = {
  id: string;
  estado: string;
  modalidad: string;
  canRescheduleIndividual: boolean;
  horario: string;
  primeraCitaLabel: string;
  displayFechaLine: string;
  displayHoraLine: string;
};

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthMatrixUtc(year: number, monthIndex: number): ({ dateKey: string | null; inMonth: boolean } | null)[][] {
  const firstWd = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cells: ({ dateKey: string; inMonth: boolean } | null)[] = [];
  for (let i = 0; i < firstWd; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      dateKey: `${year}-${pad2(monthIndex + 1)}-${pad2(d)}`,
      inMonth: true,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);
  const rows: ({ dateKey: string; inMonth: boolean } | null)[][] = [];
  for (let w = 0; w < cells.length / 7; w++) {
    rows.push(cells.slice(w * 7, w * 7 + 7));
  }
  return rows;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function ReprogramarClient({
  turnoId,
  variant = "customer",
}: {
  turnoId: string;
  variant?: ReprogramarVariant;
}) {
  const isPanel = variant === "panel";
  const pageShell = isPanel
    ? "panel-v2-theme min-h-screen bg-[#F0F1F3] px-4 pb-24 pt-8"
    : "min-h-screen bg-gradient-to-b from-[#faf6f3] to-[#f0e8e2] px-4 pb-24 pt-8";
  const backLinkClass = isPanel
    ? "text-sm font-medium text-[#B88E2F] underline-offset-2 hover:underline"
    : "text-sm font-medium text-[#963417] underline-offset-2 hover:underline";
  const accentTextClass = isPanel ? "text-[#B88E2F]" : "text-[#963417]";
  const router = useRouter();
  const apiTurnoBase =
    variant === "panel" ? "/api/panel-turnos/turnos/" : "/api/mis-turnos/turnos/";
  const backHref = variant === "panel" ? "/panel-turnos" : "/mis-turnos";
  const successHref = variant === "panel" ? "/panel-turnos?reprogramado=1" : "/mis-turnos?reprogramado=1";

  const [detail, setDetail] = useState<TurnoDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [year, setYear] = useState(() => new Date().getUTCFullYear());
  const [monthIndex, setMonthIndex] = useState(() => new Date().getUTCMonth());
  const [availability, setAvailability] = useState<Record<string, boolean> | null>(null);
  const [calLoading, setCalLoading] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ value: string; label: string }[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const horario = detail?.horario ?? "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiTurnoBase}${encodeURIComponent(turnoId)}`, {
          credentials: "same-origin",
        });
        const data = (await res.json()) as TurnoDetail & { error?: string };
        if (!res.ok) {
          if (!cancelled) setLoadError(data.error ?? "No se pudo cargar el turno.");
          return;
        }
        if (!cancelled) {
          setDetail(data);
          if (!data.canRescheduleIndividual || !isHorarioIndividualId(data.horario)) {
            setLoadError("Este turno no se puede reprogramar desde acá.");
          }
        }
      } catch {
        if (!cancelled) setLoadError("Sin conexión.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [turnoId, apiTurnoBase]);

  const loadMonth = useCallback(async () => {
    if (!horario || !isHorarioIndividualId(horario)) return;
    setCalLoading(true);
    setActionError(null);
    try {
      const u = new URL("/api/reservas/disponibilidad/mes", window.location.origin);
      u.searchParams.set("year", String(year));
      u.searchParams.set("monthIndex", String(monthIndex));
      u.searchParams.set("horario", horario);
      u.searchParams.set("excludeTurnoId", turnoId);
      const res = await fetch(u.toString(), { cache: "no-store" });
      const j = (await res.json()) as { availability?: Record<string, boolean>; error?: string };
      if (!res.ok) {
        setAvailability(null);
        setActionError(j.error ?? "No se pudo cargar el calendario.");
        return;
      }
      setAvailability(j.availability ?? {});
    } catch {
      setAvailability(null);
      setActionError("Sin conexión.");
    } finally {
      setCalLoading(false);
    }
  }, [year, monthIndex, horario, turnoId]);

  useEffect(() => {
    if (horario) void loadMonth();
  }, [horario, loadMonth]);

  useEffect(() => {
    if (!selectedDateKey || !horario) {
      setSlots(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      try {
        const u = new URL("/api/reservas/disponibilidad/dia", window.location.origin);
        u.searchParams.set("dateKey", selectedDateKey);
        u.searchParams.set("horario", horario);
        u.searchParams.set("excludeTurnoId", turnoId);
        const res = await fetch(u.toString(), { cache: "no-store" });
        const j = (await res.json()) as { slots?: { value: string; label: string }[]; error?: string };
        if (!cancelled) {
          if (!res.ok) {
            setSlots([]);
            setActionError(j.error ?? "No se pudieron cargar los horarios.");
          } else {
            setSlots(j.slots ?? []);
          }
        }
      } catch {
        if (!cancelled) {
          setSlots([]);
          setActionError("Sin conexión.");
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDateKey, horario, turnoId]);

  const matrix = useMemo(() => monthMatrixUtc(year, monthIndex), [year, monthIndex]);

  async function confirmSlot(valueJson: string) {
    let dateKey = "";
    let timeLocal = "";
    try {
      const o = JSON.parse(valueJson) as { dateKey?: string; timeLocal?: string };
      dateKey = String(o.dateKey ?? "").trim();
      timeLocal = String(o.timeLocal ?? "").trim();
    } catch {
      setActionError("Selección inválida.");
      return;
    }
    setActionBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`${apiTurnoBase}${encodeURIComponent(turnoId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ dateKey, timeLocal }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setActionError(j.error ?? "No se pudo reprogramar.");
        return;
      }
      router.replace(successHref);
      router.refresh();
    } catch {
      setActionError("Sin conexión.");
    } finally {
      setActionBusy(false);
    }
  }

  if (loadError && !detail) {
    return (
      <main className={pageShell}>
        <div className="mx-auto max-w-md">
          <p className="text-sm text-red-700">{loadError}</p>
          <Link href={backHref} className={`mt-4 inline-block ${backLinkClass}`}>
            Volver
          </Link>
        </div>
      </main>
    );
  }

  if (!detail || !detail.canRescheduleIndividual || !isHorarioIndividualId(detail.horario)) {
    return (
      <main className={pageShell}>
        <div className="mx-auto max-w-md">
          <p className="text-sm text-zinc-700">{loadError ?? "Cargando…"}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={pageShell}>
      <div className="mx-auto w-full max-w-md">
        <Link href={backHref} className={backLinkClass}>
          ← {variant === "panel" ? "Panel de turnos" : "Mis turnos"}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">Cambiar horario</h1>
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Turno actual</p>
          <p className="mt-2 text-xl font-bold leading-snug text-zinc-900">{detail.displayFechaLine}</p>
          <p className={`mt-1 text-3xl font-bold tabular-nums tracking-tight ${accentTextClass}`}>
            {detail.displayHoraLine}
          </p>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Solo fechas libres para el mismo tipo de consulta ({variant === "panel" ? "sincronizado con la agenda" : "el que reservaste"}).
        </p>

        {actionError ? (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {actionError}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (monthIndex === 0) {
                setYear((y) => y - 1);
                setMonthIndex(11);
              } else {
                setMonthIndex((m) => m - 1);
              }
              setSelectedDateKey(null);
            }}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            ← Mes
          </button>
          <p className="text-center text-sm font-semibold text-zinc-900">
            {MONTH_NAMES[monthIndex]} {year}
          </p>
          <button
            type="button"
            onClick={() => {
              if (monthIndex === 11) {
                setYear((y) => y + 1);
                setMonthIndex(0);
              } else {
                setMonthIndex((m) => m + 1);
              }
              setSelectedDateKey(null);
            }}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Mes →
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
          {calLoading ? (
            <p className="py-6 text-center text-sm text-zinc-500">Cargando calendario…</p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-zinc-500">
                {WEEKDAY_LABELS.map((w) => (
                  <div key={w} className="py-1">
                    {w}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {matrix.flatMap((row, ri) =>
                  row.map((cell, di) => {
                    const i = ri * 7 + di;
                    if (!cell || !cell.dateKey) {
                      return <div key={`e-${i}`} className="aspect-square" />;
                    }
                    const dk = cell.dateKey;
                    const free = availability?.[dk] === true;
                    const selected = dk === selectedDateKey;
                    return (
                      <button
                        key={dk}
                        type="button"
                        disabled={!free}
                        onClick={() => setSelectedDateKey(dk)}
                        className={`aspect-square rounded-lg text-sm font-medium transition ${
                          selected
                            ? "bg-[#963417] text-white"
                            : free
                              ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                              : "cursor-not-allowed bg-zinc-50 text-zinc-300"
                        }`}
                      >
                        {Number(dk.slice(8, 10))}
                      </button>
                    );
                  }),
                )}
              </div>
            </>
          )}
        </div>

        {selectedDateKey ? (
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Horarios para el {selectedDateKey}</h2>
            {slotsLoading ? (
              <p className="mt-3 text-sm text-zinc-500">Cargando…</p>
            ) : !slots || slots.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No quedó ningún horario libre ese día.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {slots.map((s) => (
                  <li key={s.value}>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => void confirmSlot(s.value)}
                      className="flex w-full items-center justify-between rounded-xl border border-zinc-200 px-3 py-3 text-left text-sm font-medium text-zinc-900 hover:border-[#963417]/50 hover:bg-[#963417]/5 disabled:opacity-50"
                    >
                      {s.label}
                      <span className="text-xs text-[#963417]">Elegir</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
