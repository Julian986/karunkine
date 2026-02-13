"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const iconCalendar = (
  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const y = d.getFullYear();
  return `${day}/${m}/${y}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInView(viewDate: Date): (Date | null)[][] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // Lunes = 0 (getDay() 1 -> 0, 0 (dom) -> 6)
  let startOffset = first.getDay() - 1;
  if (startOffset < 0) startOffset = 6;
  const total = last.getDate() + startOffset;
  const rows = Math.ceil(total / 7);
  const grid: (Date | null)[][] = [];
  let dayCount = 1 - startOffset;
  for (let r = 0; r < rows; r++) {
    const row: (Date | null)[] = [];
    for (let c = 0; c < 7; c++) {
      if (dayCount < 1 || dayCount > last.getDate()) {
        row.push(null);
      } else {
        row.push(new Date(year, month, dayCount));
      }
      dayCount++;
    }
    grid.push(row);
  }
  return grid;
}

export default function DatePicker({
  id,
  placeholder = "Fecha preferida",
  ariaLabel = "Fecha preferida",
}: {
  id: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const prevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  };
  const nextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));
  };

  const selectDate = (d: Date) => {
    setSelectedDate(d);
    setIsOpen(false);
  };

  const grid = getDaysInView(viewDate);
  const valueDisplay = selectedDate ? formatDisplay(selectedDate) : "";
  const valueSubmit = selectedDate ? toYYYYMMDD(selectedDate) : "";

  return (
    <div className="relative" ref={containerRef}>
      <input type="hidden" name="fecha" value={valueSubmit} readOnly />
      <button
        ref={buttonRef}
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center rounded-xl bg-zinc-100 py-3 pl-4 pr-11 text-left text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#d4602c]/30"
      >
        <span className={valueDisplay ? "text-zinc-800" : "text-zinc-400"}>
          {valueDisplay || placeholder}
        </span>
      </button>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {iconCalendar}
      </span>

      {isOpen && dropdownRect && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[100] rounded-xl border border-zinc-200 bg-white p-4 shadow-lg"
            style={{
              top: dropdownRect.top,
              left: dropdownRect.left,
              minWidth: dropdownRect.width,
            }}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
              aria-label="Mes anterior"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-zinc-800">
              {MESES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
              aria-label="Mes siguiente"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="mt-3">
            <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-zinc-500">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="py-1 font-medium">
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-0.5">
              {grid.flat().map((d, i) => {
                if (!d) {
                  return <div key={`e-${i}`} className="aspect-square" />;
                }
                const isSelected = selectedDate && isSameDay(d, selectedDate);
                const isToday = isSameDay(d, today);
                const isCurrentMonth = d.getMonth() === viewDate.getMonth();
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => selectDate(d)}
                    className={`aspect-square rounded-lg text-sm transition ${
                      !isCurrentMonth
                        ? "text-zinc-300"
                        : isSelected
                          ? "bg-[#d4602c] font-semibold text-white hover:opacity-90"
                          : isToday
                            ? "font-semibold text-[#d4602c] ring-2 ring-[#d4602c] ring-offset-2 hover:bg-[#d4602c]/10"
                            : "text-zinc-800 hover:bg-[#d4602c]/10 hover:text-[#d4602c]"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
          document.body
        )}
    </div>
  );
}
