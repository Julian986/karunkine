/**
 * Reglas de horarios Wanda / Karün: templates semanales + expansión a citas concretas (dateKey + HH:mm).
 * Fechas usan calendario civil YYYY-MM-DD; weekday vía mediodía UTC para evitar TZ del servidor.
 */

export type CitaDoc = {
  dateKey: string;
  timeLocal: string;
  tipo: "consulta_individual" | "evaluacion_grupal" | "clase_grupal";
  templateId?: string;
};

export const HORARIOS_GRUPAL_IDS = [
  "grupal_930",
  "grupal_1030",
  "grupal_16",
  "grupal_17",
] as const;

export const HORARIOS_INDIVIDUAL_IDS = [
  "lun_1600",
  "lun_1700",
  "mie_900",
  "mie_1000",
  "mie_1600",
  "mie_1700",
  "vie_900",
  "vie_1000",
] as const;

export type HorarioGrupalId = (typeof HORARIOS_GRUPAL_IDS)[number];
export type HorarioIndividualId = (typeof HORARIOS_INDIVIDUAL_IDS)[number];

const GRUPAL_TIME: Record<HorarioGrupalId, string> = {
  grupal_930: "09:30",
  grupal_1030: "10:30",
  grupal_16: "16:00",
  grupal_17: "17:00",
};

/** JS weekday: 0=dom … 6=sab */
const INDIVIDUAL_RULES: Record<
  HorarioIndividualId,
  { weekday: number; timeLocal: string }
> = {
  lun_1600: { weekday: 1, timeLocal: "16:00" },
  lun_1700: { weekday: 1, timeLocal: "17:00" },
  mie_900: { weekday: 3, timeLocal: "09:00" },
  mie_1000: { weekday: 3, timeLocal: "10:00" },
  mie_1600: { weekday: 3, timeLocal: "16:00" },
  mie_1700: { weekday: 3, timeLocal: "17:00" },
  vie_900: { weekday: 5, timeLocal: "09:00" },
  vie_1000: { weekday: 5, timeLocal: "10:00" },
};

export function isHorarioGrupalId(v: string): v is HorarioGrupalId {
  return (HORARIOS_GRUPAL_IDS as readonly string[]).includes(v);
}

export function isHorarioIndividualId(v: string): v is HorarioIndividualId {
  return (HORARIOS_INDIVIDUAL_IDS as readonly string[]).includes(v);
}

export function slotKey(dateKey: string, timeLocal: string): string {
  return `${dateKey}|${normalizeTimeLocal(timeLocal)}`;
}

export function parseSlotKey(key: string): { dateKey: string; timeLocal: string } | null {
  const i = key.indexOf("|");
  if (i <= 0) return null;
  const dateKey = key.slice(0, i);
  const timeLocal = key.slice(i + 1);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  if (!/^\d{2}:\d{2}$/.test(timeLocal)) return null;
  return { dateKey, timeLocal };
}

export function normalizeTimeLocal(t: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return t.trim();
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const min = Math.min(59, Math.max(0, Number(m[2])));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Weekday 0–6 (dom–sab) para el calendario civil dateKey. */
export function isoDateWeekday(dateKey: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0));
  return d.getUTCDay();
}

/** Fecha civil de hoy en UTC (misma convención que `isoDateWeekday` / ocupación). */
export function utcTodayDateKey(): string {
  const d = new Date();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${mo}-${day}`;
}

export function formatDisplayFechaHora(dateKey: string, timeLocal: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return `${dateKey} ${timeLocal}`;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, day, 12, 0, 0));
  const diaSem = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(dt);
  const ds = diaSem.charAt(0).toUpperCase() + diaSem.slice(1);
  const fechaCorta = `${String(day).padStart(2, "0")}/${String(m[2]).padStart(2, "0")}`;
  return `${ds} ${fechaCorta} ${timeLocal}`;
}

export function individualTemplatesForWeekday(weekday: number): HorarioIndividualId[] {
  return (Object.keys(INDIVIDUAL_RULES) as HorarioIndividualId[]).filter(
    (id) => INDIVIDUAL_RULES[id].weekday === weekday,
  );
}

export function timeForIndividualTemplate(id: HorarioIndividualId): string {
  return INDIVIDUAL_RULES[id].timeLocal;
}

/**
 * Ocurrencias concretas (dateKey + hora) del template desde `fromDateKey` (inclusive),
 * recorriendo semanas en orden cronológico (máx. ~`maxWeeks` semanas de búsqueda).
 */
export function eachIndividualOccurrenceFrom(
  id: HorarioIndividualId,
  fromDateKey: string,
  maxWeeks: number,
): { dateKey: string; timeLocal: string }[] {
  const rule = INDIVIDUAL_RULES[id];
  const out: { dateKey: string; timeLocal: string }[] = [];
  const maxDays = maxWeeks * 7 + 6;
  for (let i = 0; i <= maxDays; i++) {
    const dk = addDaysDateKey(fromDateKey, i);
    if (isoDateWeekday(dk) !== rule.weekday) continue;
    out.push({ dateKey: dk, timeLocal: rule.timeLocal });
  }
  return out;
}

export function timeForGrupalTemplate(id: HorarioGrupalId): string {
  return GRUPAL_TIME[id];
}

function parseDateKeyDays(dateKey: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Math.floor(t / 86400000);
}

export function addDaysDateKey(dateKey: string, deltaDays: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return dateKey;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + deltaDays);
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export function dateKeysBetweenInclusive(from: string, to: string): string[] {
  const a = parseDateKeyDays(from);
  const b = parseDateKeyDays(to);
  if (a === null || b === null || a > b) return [];
  const out: string[] = [];
  for (let i = 0; i <= b - a; i++) {
    out.push(addDaysDateKey(from, i));
  }
  return out;
}

/** Lunes de la semana ISO que contiene `dateKey` (calendario civil). */
export function mondayOfWeekContainingDateKey(dateKey: string): string | null {
  const wd = isoDateWeekday(dateKey);
  if (wd === null) return null;
  const mon0 = wd === 0 ? 6 : wd - 1;
  return addDaysDateKey(dateKey, -mon0);
}

/** Martes (2) y jueves (4) en rango inclusive. */
export function listMarJueDateKeysInRange(fromDateKey: string, toDateKey: string): string[] {
  return dateKeysBetweenInclusive(fromDateKey, toDateKey).filter((dk) => {
    const w = isoDateWeekday(dk);
    return w === 2 || w === 4;
  });
}

/**
 * Expande plan grupal: todas las mar/jue con la misma hora local, desde la primera semana que contiene anchorDateKey.
 */
export function expandGrupalCitas(params: {
  horarioId: HorarioGrupalId;
  /** Cualquier mar o jue de la semana de inicio (o el primer mar/jue >= hoy que elija el usuario). */
  anchorMarOrJueDateKey: string;
  weeks: number;
}): CitaDoc[] {
  const timeLocal = normalizeTimeLocal(GRUPAL_TIME[params.horarioId]);
  const w0 = isoDateWeekday(params.anchorMarOrJueDateKey);
  if (w0 !== 2 && w0 !== 4) return [];

  const mondayOfAnchorWeek = mondayOfWeekContainingDateKey(params.anchorMarOrJueDateKey);
  if (!mondayOfAnchorWeek) return [];
  const end = addDaysDateKey(mondayOfAnchorWeek, params.weeks * 7 - 1);
  const keys = listMarJueDateKeysInRange(mondayOfAnchorWeek, end);
  return keys.map((dateKey) => ({
    dateKey,
    timeLocal,
    tipo: "clase_grupal" as const,
    templateId: params.horarioId,
  }));
}

export function matchIndividualTemplate(dateKey: string, timeLocal: string): HorarioIndividualId | null {
  const wd = isoDateWeekday(dateKey);
  if (wd === null) return null;
  const t = normalizeTimeLocal(timeLocal);
  for (const id of Object.keys(INDIVIDUAL_RULES) as HorarioIndividualId[]) {
    const r = INDIVIDUAL_RULES[id];
    if (r.weekday === wd && r.timeLocal === t) return id;
  }
  return null;
}

export function matchGrupalTemplate(dateKey: string, timeLocal: string): HorarioGrupalId | null {
  const wd = isoDateWeekday(dateKey);
  if (wd !== 2 && wd !== 4) return null;
  const t = normalizeTimeLocal(timeLocal);
  for (const id of HORARIOS_GRUPAL_IDS) {
    if (GRUPAL_TIME[id] === t) return id;
  }
  return null;
}
