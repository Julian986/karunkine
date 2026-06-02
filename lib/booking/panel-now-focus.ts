/** Duración estimada por tipo de cita (solo UI del panel). */
export const PANEL_CITA_DURATION_MIN: Record<string, number> = {
  consulta_individual: 60,
  evaluacion_grupal: 60,
  clase_grupal: 90,
};

export function hhmmToMinutes(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function localTodayDateKey(now = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function localNowMinutes(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

/** Franja actual (bloque 30 min) y la anterior. */
export function getPanelFocusSlotMinutes(now = new Date()): [number, number] {
  const nowM = localNowMinutes(now);
  const h = Math.floor(nowM / 60);
  const m = nowM % 60;
  const slotStart = m < 30 ? 0 : 30;
  const current = h * 60 + slotStart;
  const previous = current - 30;
  return [current, previous];
}

export function isTurnoTimeFocused(
  timeLocal: string,
  selectedDateKey: string,
  now = new Date(),
): boolean {
  if (selectedDateKey !== localTodayDateKey(now)) return false;
  const startM = hhmmToMinutes(timeLocal);
  if (startM === null) return false;
  const [current, previous] = getPanelFocusSlotMinutes(now);
  return startM === current || (previous >= 0 && startM === previous);
}

export function isTurnoInProgress(
  timeLocal: string,
  tipoCita: string,
  selectedDateKey: string,
  now = new Date(),
): boolean {
  if (!isTurnoTimeFocused(timeLocal, selectedDateKey, now)) return false;
  const startM = hhmmToMinutes(timeLocal);
  if (startM === null) return false;
  const nowM = localNowMinutes(now);
  if (nowM < startM) return false;
  const duration = PANEL_CITA_DURATION_MIN[tipoCita] ?? 60;
  return nowM < startM + duration;
}

export function pickScrollToTurnoId(
  eventos: Array<{ id: string; dateKey: string; timeLocal: string }>,
  selectedDateKey: string,
  now = new Date(),
): string | null {
  if (selectedDateKey !== localTodayDateKey(now)) return null;
  const [current] = getPanelFocusSlotMinutes(now);
  const match = eventos.find(
    (e) => e.dateKey === selectedDateKey && hhmmToMinutes(e.timeLocal) === current,
  );
  if (match) return match.id;
  const [, previous] = getPanelFocusSlotMinutes(now);
  if (previous < 0) return null;
  return (
    eventos.find((e) => e.dateKey === selectedDateKey && hhmmToMinutes(e.timeLocal) === previous)
      ?.id ?? null
  );
}

export function panelDurationLabel(tipoCita: string): string | null {
  const min = PANEL_CITA_DURATION_MIN[tipoCita];
  if (!min) return null;
  if (min >= 60 && min % 60 === 0) {
    const h = min / 60;
    return h === 1 ? "60 min" : `${h} h`;
  }
  return `${min} min`;
}
