"use client";

import { useMemo, useState } from "react";
import {
  buildPanelMonthGrid,
  PANEL_WEEK_LETTERS,
  panelMonthTitle,
} from "../../lib/booking/panel-month-grid";
import { formatDisplayFechaHora } from "../../lib/turnos/wanda-schedule";

export type PanelFechaHoraSeleccion = {
  dateKey: string;
  timeLocal: string;
  etiqueta: string;
};

type Props = {
  titulo: string;
  accentColor: string;
  onSeleccion: (s: PanelFechaHoraSeleccion) => void;
};

function localTodayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

export function PanelTurnoFechaHoraPicker({ titulo, accentColor, onSeleccion }: Props) {
  const minDateKey = useMemo(() => localTodayDateKey(), []);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [timeLocal, setTimeLocal] = useState("10:00");

  const grid = useMemo(() => buildPanelMonthGrid(year, month), [year, month]);
  const tituloMes = useMemo(() => panelMonthTitle(year, month), [year, month]);
  const hoyKey = localTodayDateKey();

  function emit(nextDate: string, nextTime: string) {
    const tl = nextTime.trim();
    if (!/^\d{2}:\d{2}$/.test(tl)) return;
    onSeleccion({
      dateKey: nextDate,
      timeLocal: tl,
      etiqueta: formatDisplayFechaHora(nextDate, tl),
    });
  }

  function elegirDia(dk: string) {
    if (dk < minDateKey) return;
    setDateKey(dk);
    emit(dk, timeLocal);
  }

  function cambiarHora(t: string) {
    setTimeLocal(t);
    if (dateKey) emit(dateKey, t);
  }

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

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
      <p className="text-sm font-semibold text-zinc-800">{titulo}</p>
      <p className="mt-1 text-xs leading-snug text-zinc-500">
        Elegí el día en el calendario y la hora que necesites (no solo los horarios de la web).
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
          {tituloMes}
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

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-zinc-500">
        {PANEL_WEEK_LETTERS.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.map((cell) => {
          const pasado = cell.dateKey < minDateKey;
          const seleccionado = dateKey === cell.dateKey;
          const esHoy = cell.dateKey === hoyKey;
          return (
            <button
              key={cell.dateKey}
              type="button"
              disabled={pasado}
              onClick={() => elegirDia(cell.dateKey)}
              className={`flex h-9 items-center justify-center rounded-lg text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${
                seleccionado
                  ? "text-white shadow-sm"
                  : cell.inMonth
                    ? "text-zinc-800 hover:bg-white"
                    : "text-zinc-400 hover:bg-white/60"
              } ${esHoy && !seleccionado ? "ring-1 ring-zinc-300" : ""}`}
              style={seleccionado ? { backgroundColor: accentColor } : undefined}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium text-zinc-600" htmlFor="panel-hora-libre">
          Hora
        </label>
        <input
          id="panel-hora-libre"
          type="time"
          min="07:00"
          max="21:00"
          step={60}
          value={timeLocal}
          onChange={(e) => cambiarHora(e.target.value)}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
        />
        <p className="mt-1 text-[11px] text-zinc-500">Podés elegir cualquier minuto (ej. 10:13).</p>
      </div>

      {dateKey ? (
        <p className="mt-2 text-xs font-medium text-zinc-700">
          Seleccionado: {formatDisplayFechaHora(dateKey, timeLocal)}
        </p>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">Elegí un día del calendario.</p>
      )}
    </div>
  );
}
