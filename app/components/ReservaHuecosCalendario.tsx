"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildPanelMonthGrid,
  PANEL_WEEK_LETTERS,
  panelMonthTitle,
} from "../../lib/booking/panel-month-grid";
import { GRUPAL_CUPO_MAX_POR_BANDA } from "../../lib/turnos/wanda-schedule";
const iconChevronLeft = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);
const iconChevronRight = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

export type HuecoSeleccionado = {
  templateId: string;
  dateKey: string;
  timeLocal: string;
  etiqueta: string;
};

type Props = {
  mode: "individual" | "grupal-eval";
  /** Obligatorio si `mode === "grupal-eval"` (ej. grupal_930). */
  horarioGrupalId?: string;
  accentColor: string;
  onSeleccion: (h: HuecoSeleccionado) => void;
  titulo: string;
};

function localTodayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseSlotValue(
  value: string,
): { dateKey: string; timeLocal: string; templateId: string } | null {
  try {
    const p = JSON.parse(value) as { dateKey?: string; timeLocal?: string; templateId?: string };
    if (!p.dateKey || !p.timeLocal || !p.templateId) return null;
    return { dateKey: p.dateKey, timeLocal: p.timeLocal, templateId: p.templateId };
  } catch {
    return null;
  }
}

/** Solo hora para chips (ej. 09:00 → 9:00). */
function formatHoraCorta(timeLocal: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(timeLocal.trim());
  if (!m) return timeLocal.trim();
  return `${Number(m[1])}:${m[2]}`;
}

/** Título del día elegido (una vez arriba de la grilla de horas). */
function tituloDiaSeleccionado(dateKey: string): string {
  const rx = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!rx) return dateKey;
  const d = new Date(Date.UTC(Number(rx[1]), Number(rx[2]) - 1, Number(rx[3]), 12, 0, 0));
  const s = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Resumen para el turno (incluye día una sola vez). */
function etiquetaTurnoCompleta(dateKey: string, timeLocal: string): string {
  const rx = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!rx) return `${dateKey} · ${formatHoraCorta(timeLocal)}`;
  const d = new Date(Date.UTC(Number(rx[1]), Number(rx[2]) - 1, Number(rx[3]), 12, 0, 0));
  const dow = new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(d);
  const cap = dow.charAt(0).toUpperCase() + dow.slice(1).replace(/\.$/, "");
  return `${cap} ${rx[3]}/${rx[2]}/${rx[1]} · ${formatHoraCorta(timeLocal)}`;
}

export function ReservaHuecosCalendario({
  mode,
  horarioGrupalId,
  accentColor,
  onSeleccion,
  titulo,
}: Props) {
  const minDateKey = useMemo(() => localTodayDateKey(), []);
  const [year, setYear] = useState(() => {
    const d = new Date();
    return d.getFullYear();
  });
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return d.getMonth() + 1;
  });

  const [availability, setAvailability] = useState<Record<string, boolean> | null>(null);
  /** La banda grupal elegida alcanzó el cupo máximo de reservas activas. */
  const [bandSinCupo, setBandSinCupo] = useState(false);
  const [mesError, setMesError] = useState<string | null>(null);
  const [cargandoMes, setCargandoMes] = useState(false);

  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ value: string; label: string }[] | null>(null);
  const [cargandoDia, setCargandoDia] = useState(false);
  const [diaError, setDiaError] = useState<string | null>(null);
  /** `value` del JSON del slot elegido (marca visual hasta cambiar de día/mes). */
  const [slotMarcadoValue, setSlotMarcadoValue] = useState<string | null>(null);

  const grid = useMemo(() => buildPanelMonthGrid(year, month), [year, month]);
  const tituloMes = useMemo(() => panelMonthTitle(year, month), [year, month]);

  const fetchMes = useCallback(async () => {
    setCargandoMes(true);
    setMesError(null);
    setAvailability(null);
    setBandSinCupo(false);
    setDiaSeleccionado(null);
    setSlots(null);
    setSlotMarcadoValue(null);
    try {
      const monthIndex = month - 1;
      const base =
        mode === "individual"
          ? `/api/reservas/disponibilidad/mes?year=${year}&monthIndex=${monthIndex}`
          : `/api/reservas/disponibilidad/mes-eval-grupal?year=${year}&monthIndex=${monthIndex}&horario=${encodeURIComponent(horarioGrupalId ?? "")}`;
      const res = await fetch(base, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as {
        availability?: unknown;
        bandSinCupo?: unknown;
        error?: string;
      };
      if (!res.ok) {
        setMesError(j.error ?? "No se pudo cargar el mes.");
        return;
      }
      const av = j.availability;
      if (!av || typeof av !== "object") {
        setMesError("Respuesta inválida.");
        return;
      }
      setAvailability(av as Record<string, boolean>);
      setBandSinCupo(j.bandSinCupo === true);
    } catch {
      setMesError("Error de red al cargar el calendario.");
    } finally {
      setCargandoMes(false);
    }
  }, [year, month, mode, horarioGrupalId]);

  useEffect(() => {
    if (mode === "grupal-eval" && !horarioGrupalId?.trim()) return;
    void fetchMes();
  }, [fetchMes, mode, horarioGrupalId]);

  const irMesAnterior = () => {
    if (month <= 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const irMesSiguiente = () => {
    if (month >= 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  async function abrirDia(dateKey: string) {
    if (mode === "grupal-eval" && !horarioGrupalId) return;
    setDiaSeleccionado(dateKey);
    setSlotMarcadoValue(null);
    setCargandoDia(true);
    setDiaError(null);
    setSlots(null);
    try {
      const url =
        mode === "individual"
          ? `/api/reservas/disponibilidad/dia?dateKey=${encodeURIComponent(dateKey)}`
          : `/api/reservas/disponibilidad/dia-eval-grupal?dateKey=${encodeURIComponent(dateKey)}&horario=${encodeURIComponent(horarioGrupalId!)}`;
      const res = await fetch(url, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as { slots?: unknown; error?: string };
      if (!res.ok) {
        setDiaError(j.error ?? "No se pudieron cargar los horarios.");
        return;
      }
      const raw = j.slots;
      const list = Array.isArray(raw)
        ? raw.filter((x): x is { value: string; label: string } => {
            return (
              x != null &&
              typeof x === "object" &&
              typeof (x as { value?: unknown }).value === "string" &&
              typeof (x as { label?: unknown }).label === "string"
            );
          })
        : [];
      setSlots(list);
    } catch {
      setDiaError("Error de red.");
    } finally {
      setCargandoDia(false);
    }
  }

  function elegirSlot(value: string) {
    const p = parseSlotValue(value);
    if (!p) return;
    setSlotMarcadoValue(value);
    onSeleccion({
      templateId: p.templateId,
      dateKey: p.dateKey,
      timeLocal: p.timeLocal,
      etiqueta: etiquetaTurnoCompleta(p.dateKey, p.timeLocal),
    });
  }

  if (mode === "grupal-eval" && !horarioGrupalId?.trim()) {
    return null;
  }

  const hoyKey = localTodayDateKey();

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
      <p className="text-sm font-semibold text-zinc-800">{titulo}</p>
      <p className="mt-1 text-xs leading-snug text-zinc-500">
        Solo ves días y horarios con cupo real. Elegí el día y después el horario exacto.
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={irMesAnterior}
          aria-label="Mes anterior"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
        >
          {iconChevronLeft}
        </button>
        <span className="min-w-0 flex-1 truncate text-center text-sm font-medium capitalize text-zinc-800">
          {cargandoMes ? "…" : tituloMes}
        </span>
        <button
          type="button"
          onClick={irMesSiguiente}
          aria-label="Mes siguiente"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
        >
          {iconChevronRight}
        </button>
      </div>

      {mesError && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {mesError}
        </p>
      )}

      {mode === "grupal-eval" && !mesError && !cargandoMes && bandSinCupo && (
        <p
          className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-950"
          role="status"
        >
          Esta franja de clases grupales ya alcanzó el cupo de{" "}
          {GRUPAL_CUPO_MAX_POR_BANDA} reservas activas. Por eso no podés elegir fecha de evaluación aquí.
          Probá otra franja horaria o escribinos si necesitás ayuda.
        </p>
      )}

      {!mesError && (
        <div className="mt-3 overflow-x-auto">
          <div className="grid min-w-[280px] grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            {PANEL_WEEK_LETTERS.map((L) => (
              <div key={L} className="py-1">
                {L}
              </div>
            ))}
          </div>
          <div className="mt-1 grid min-w-[280px] grid-cols-7 gap-1">
            {grid.map((cell) => {
              const esHoy = cell.inMonth && cell.dateKey === hoyKey;
              const disponible =
                cell.inMonth &&
                availability !== null &&
                availability[cell.dateKey] === true &&
                cell.dateKey >= minDateKey;
              const esDiaSel = diaSeleccionado === cell.dateKey;
              return (
                <button
                  key={`${cell.dateKey}-${cell.day}-${cell.inMonth}`}
                  type="button"
                  disabled={!disponible || cargandoMes}
                  title={esHoy ? "Hoy" : undefined}
                  aria-current={esHoy ? "date" : undefined}
                  onClick={() => {
                    if (!disponible) return;
                    void abrirDia(cell.dateKey);
                  }}
                  className={`relative flex h-9 items-center justify-center rounded-lg text-sm transition ${
                    !cell.inMonth
                      ? "text-zinc-300"
                      : !disponible || cargandoMes
                        ? esHoy
                          ? "cursor-not-allowed bg-zinc-50 font-medium text-zinc-500 ring-1 ring-dashed ring-zinc-400"
                          : "cursor-not-allowed text-zinc-300"
                        : esDiaSel
                          ? "font-semibold text-white ring-2 ring-white/40 ring-offset-1 ring-offset-zinc-50"
                          : esHoy
                            ? "bg-white font-semibold text-zinc-900 ring-2 ring-zinc-500 ring-offset-1 ring-offset-zinc-50 hover:bg-zinc-100"
                            : "bg-white text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-100"
                  }`}
                  style={
                    esDiaSel && disponible && !cargandoMes
                      ? { backgroundColor: accentColor }
                      : undefined
                  }
                >
                  {cell.day}
                  {esHoy && cell.inMonth && (!esDiaSel || !disponible || cargandoMes) && (
                    <span
                      className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                        !disponible || cargandoMes ? "bg-zinc-400" : "bg-zinc-600"
                      }`}
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {diaSeleccionado && (
        <div className="mt-4 border-t border-zinc-200 pt-4">
          <p className="text-[13px] font-semibold leading-snug text-zinc-800">
            {tituloDiaSeleccionado(diaSeleccionado)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">Elegí un horario disponible</p>
          {cargandoDia && <p className="mt-3 text-sm text-zinc-500">Cargando…</p>}
          {diaError && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {diaError}
            </p>
          )}
          {!cargandoDia && !diaError && slots && slots.length === 0 && (
            <p className="mt-3 text-sm text-zinc-500">No quedan horarios libres ese día.</p>
          )}
          {!cargandoDia && slots && slots.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {slots.map((s) => {
                const parsed = parseSlotValue(s.value);
                const hora = parsed ? formatHoraCorta(parsed.timeLocal) : s.label;
                const aria = parsed
                  ? `Reservar ${tituloDiaSeleccionado(parsed.dateKey)} a las ${formatHoraCorta(parsed.timeLocal)}`
                  : s.label;
                const marcado = slotMarcadoValue === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    aria-label={aria}
                    aria-pressed={marcado}
                    onClick={() => elegirSlot(s.value)}
                    className={`flex min-h-[48px] items-center justify-center rounded-xl px-2 text-base font-semibold tabular-nums tracking-tight shadow-sm transition active:scale-[0.98] ${
                      marcado
                        ? "border-2 border-white/50 text-white ring-2 ring-black/10 ring-offset-2 ring-offset-zinc-50"
                        : "border border-zinc-200/90 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50/90 hover:shadow"
                    }`}
                    style={marcado ? { backgroundColor: accentColor } : undefined}
                  >
                    {hora}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
