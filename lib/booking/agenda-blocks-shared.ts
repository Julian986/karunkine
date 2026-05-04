/**
 * Reglas de bloqueo de agenda sin dependencias de Node/Mongo (seguro para Client Components).
 */

export type AgendaBlockRecurrence =
  | null
  | {
      type: "weekly";
      untilDateKey?: string | null;
    };

export type AgendaBlockRule = {
  anchorDateKey: string;
  recurrence: AgendaBlockRecurrence;
};

export function parseDateKeyLocal(dateKey: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

/** Mediodía UTC: mismo criterio civil que `isoDateWeekday` en turnos (evita cruces TZ en CDN/servidor). */
export function parseDateKeyUtcNoon(dateKey: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, d, 12, 0, 0));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo || dt.getUTCDate() !== d) return null;
  return dt;
}

function sameWeekday(aKey: string, bKey: string): boolean {
  const a = parseDateKeyUtcNoon(aKey);
  const b = parseDateKeyUtcNoon(bKey);
  if (!a || !b) return false;
  return a.getUTCDay() === b.getUTCDay();
}

export function agendaBlockAppliesToDateKey(doc: AgendaBlockRule, dateKey: string): boolean {
  if (!doc.recurrence) {
    return doc.anchorDateKey === dateKey;
  }
  if (doc.recurrence.type !== "weekly") return false;
  if (dateKey < doc.anchorDateKey) return false;
  if (!sameWeekday(doc.anchorDateKey, dateKey)) return false;
  const until = doc.recurrence.untilDateKey?.trim();
  if (until && dateKey > until) return false;
  return true;
}
