/** Grilla de mes alineada a lunes. Fechas civiles en UTC (mediodía), alineado a `isoDateWeekday` / ocupación — evita desvíos entre localhost y Vercel. */

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export const PANEL_WEEK_LETTERS = ["L", "M", "X", "J", "V", "S", "D"] as const;

export type PanelMonthCell = { day: number; inMonth: boolean; dateKey: string };

/** Días del mes civil `month` (1–12), último día inclusive. */
function daysInCalendarMonthUtc(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0, 12, 0, 0)).getUTCDate();
}

/** `month`: 1–12 (enero = 1). Siempre UTC para coincidir con turnos y APIs de disponibilidad. */
export function buildPanelMonthGrid(year: number, month: number): PanelMonthCell[] {
  const lastDay = daysInCalendarMonthUtc(year, month);
  const startDow = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)).getUTCDay();
  const mondayOffset = startDow === 0 ? 6 : startDow - 1;

  const pm = month === 1 ? 12 : month - 1;
  const py = month === 1 ? year - 1 : year;
  const prevLast = daysInCalendarMonthUtc(py, pm);

  const cells: PanelMonthCell[] = [];

  for (let i = 0; i < mondayOffset; i++) {
    const d = prevLast - mondayOffset + i + 1;
    cells.push({
      day: d,
      inMonth: false,
      dateKey: `${py}-${pad2(pm)}-${pad2(d)}`,
    });
  }
  for (let d = 1; d <= lastDay; d++) {
    cells.push({
      day: d,
      inMonth: true,
      dateKey: `${year}-${pad2(month)}-${pad2(d)}`,
    });
  }
  let nextM = month + 1;
  let nextY = year;
  if (nextM > 12) {
    nextM = 1;
    nextY += 1;
  }
  let dNext = 1;
  while (cells.length % 7 !== 0 || cells.length < 35) {
    cells.push({
      day: dNext,
      inMonth: false,
      dateKey: `${nextY}-${pad2(nextM)}-${pad2(dNext)}`,
    });
    dNext += 1;
  }

  return cells;
}

export function panelMonthTitle(year: number, month: number) {
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)));
}
