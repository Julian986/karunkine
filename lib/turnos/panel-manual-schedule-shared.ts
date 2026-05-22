/**
 * Utilidades de agenda manual del panel (sin MongoDB).
 * Usar este módulo en componentes cliente; la resolución de citas va en `panel-manual-schedule.ts`.
 */

import { addDaysDateKey, isoDateWeekday, utcTodayDateKey } from "./wanda-schedule";

export const PANEL_HORARIO_LIBRE = "panel_libre";

/** Tope repeticiones semanales sin fecha de fin. */
export const PANEL_REPEAT_MAX_WEEKLY = 104;

/** Tope repeticiones mensuales sin fecha de fin (~4 años). */
export const PANEL_REPEAT_MAX_MONTHLY = 48;

/** @deprecated Usar PANEL_REPEAT_MAX_WEEKLY */
export const PANEL_REPEAT_MAX_OCCURRENCES = PANEL_REPEAT_MAX_WEEKLY;

export type PanelRepeatMode = "weekly" | "monthly";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function daysInCalendarMonthUtc(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0, 12, 0, 0)).getUTCDate();
}

function parseYearMonth(dateKey: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(dateKey.trim());
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
}

function addCalendarMonths(year: number, month1to12: number, deltaMonths: number): { year: number; month: number } {
  const d = new Date(Date.UTC(year, month1to12 - 1 + deltaMonths, 1, 12, 0, 0));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/** Mismo día de la semana que la ancla; en cada mes, el que más se acerca al día del mes elegido (ej. jueves ~29). */
export function dateKeyForWeekdayNearDayOfMonth(
  year: number,
  month1to12: number,
  weekday: number,
  preferDayOfMonth: number,
): string | null {
  const last = daysInCalendarMonthUtc(year, month1to12);
  let best: string | null = null;
  let bestDist = Infinity;
  for (let d = 1; d <= last; d++) {
    const dk = `${year}-${pad2(month1to12)}-${pad2(d)}`;
    if (isoDateWeekday(dk) !== weekday) continue;
    const dist = Math.abs(d - preferDayOfMonth);
    if (dist < bestDist) {
      bestDist = dist;
      best = dk;
    }
  }
  return best;
}

function firstMonthlyRepeatOnOrAfter(anchorDateKey: string, minDateKey: string): string | null {
  const wd = isoDateWeekday(anchorDateKey);
  const anchorYm = parseYearMonth(anchorDateKey);
  const preferDay = Number(/^(\d{4})-(\d{2})-(\d{2})$/.exec(anchorDateKey.trim())?.[3]);
  if (wd === null || !anchorYm || !Number.isFinite(preferDay)) return null;

  if (anchorDateKey >= minDateKey) return anchorDateKey;

  let { year, month } = parseYearMonth(minDateKey) ?? anchorYm;

  for (let i = 0; i < 600; i++) {
    const dk = dateKeyForWeekdayNearDayOfMonth(year, month, wd, preferDay);
    if (dk && dk >= minDateKey) return dk;
    ({ year, month } = addCalendarMonths(year, month, 1));
  }
  return null;
}

function firstOccurrenceOnOrAfterToday(anchorDateKey: string, mode: PanelRepeatMode): string {
  const today = utcTodayDateKey();
  if (anchorDateKey >= today) return anchorDateKey;

  if (mode === "weekly") {
    const wd = isoDateWeekday(anchorDateKey);
    if (wd === null) return anchorDateKey;
    for (let i = 0; i < 7; i++) {
      const dk = addDaysDateKey(today, i);
      if (isoDateWeekday(dk) === wd) return dk;
    }
    return anchorDateKey;
  }

  return firstMonthlyRepeatOnOrAfter(anchorDateKey, today) ?? anchorDateKey;
}

export function expandWeeklyDateKeys(params: {
  anchorDateKey: string;
  repeatWeekly: boolean;
  repeatUntilDateKey?: string | null;
}): string[] {
  if (!params.repeatWeekly) return [params.anchorDateKey.trim()].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  return expandRecurringDateKeys({
    anchorDateKey: params.anchorDateKey,
    repeatMode: "weekly",
    repeatUntilDateKey: params.repeatUntilDateKey,
  });
}

/** Un mismo día de la semana por mes (ej. cada jueves cercano al 29), no el número 29 en cualquier día. */
export function expandMonthlyDateKeys(params: {
  anchorDateKey: string;
  repeatUntilDateKey?: string | null;
}): string[] {
  const anchor = params.anchorDateKey.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor)) return [];

  const wd = isoDateWeekday(anchor);
  const anchorYm = parseYearMonth(anchor);
  const preferDay = Number(/^(\d{4})-(\d{2})-(\d{2})$/.exec(anchor)?.[3]);
  if (wd === null || !anchorYm || !Number.isFinite(preferDay)) return [anchor];

  const until = params.repeatUntilDateKey?.trim() || null;
  const today = utcTodayDateKey();
  const minKey = anchor >= today ? anchor : today;

  let { year, month } = anchorYm;
  if (anchor < today) {
    const fromToday = parseYearMonth(today);
    if (fromToday) {
      year = fromToday.year;
      month = fromToday.month;
    }
  }

  const out: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < PANEL_REPEAT_MAX_MONTHLY; i++) {
    const dk = dateKeyForWeekdayNearDayOfMonth(year, month, wd, preferDay);
    if (dk && dk >= minKey && !seen.has(dk)) {
      if (until && dk > until) break;
      seen.add(dk);
      out.push(dk);
    }
    if (!until && out.length >= PANEL_REPEAT_MAX_MONTHLY) break;
    ({ year, month } = addCalendarMonths(year, month, 1));
  }

  if (out.length === 0 && anchor >= today) return [anchor];
  return out;
}

export function expandRecurringDateKeys(params: {
  anchorDateKey: string;
  repeatMode?: PanelRepeatMode | null;
  repeatUntilDateKey?: string | null;
}): string[] {
  const anchor = params.anchorDateKey.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor)) return [];

  if (!params.repeatMode) return [anchor];

  if (params.repeatMode === "monthly") {
    return expandMonthlyDateKeys({
      anchorDateKey: anchor,
      repeatUntilDateKey: params.repeatUntilDateKey,
    });
  }

  const until = params.repeatUntilDateKey?.trim() || null;
  const today = utcTodayDateKey();
  const minKey = anchor >= today ? anchor : today;
  const start = firstOccurrenceOnOrAfterToday(anchor, "weekly");
  const out: string[] = [];
  const seen = new Set<string>();
  let d = start;

  while (out.length < PANEL_REPEAT_MAX_WEEKLY) {
    if (until && d > until) break;
    if (d >= minKey && !seen.has(d)) {
      seen.add(d);
      out.push(d);
    }
    const next = addDaysDateKey(d, 7);
    if (!until) {
      if (out.length >= PANEL_REPEAT_MAX_WEEKLY) break;
      d = next;
      continue;
    }
    if (next > until) break;
    d = next;
  }

  if (out.length === 0 && anchor >= today) return [anchor];
  return out;
}
