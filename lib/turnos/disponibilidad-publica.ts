import type { Db } from "mongodb";

import { buildPanelMonthGrid } from "../booking/panel-month-grid";
import {
  eachIndividualOccurrenceFrom,
  formatDisplayFechaHora,
  individualTemplatesForWeekday,
  isHorarioGrupalId,
  isHorarioIndividualId,
  isoDateWeekday,
  normalizeTimeLocal,
  slotKey,
  timeForGrupalTemplate,
  timeForIndividualTemplate,
  utcTodayDateKey,
  type HorarioGrupalId,
  type HorarioIndividualId,
} from "./wanda-schedule";
import { HORARIOS_INDIVIDUAL } from "../validators/reserva-turno";
import { hasGrupalEvalCombo } from "./resolve-reserva-citas";
import {
  grupalBandFree,
  isGrupalHorarioGloballyTaken,
  isSlotFreePublic,
  loadOccupiedSlotKeysForMonth,
  loadOccupiedSlotKeysGlobal,
} from "./wanda-occupancy";

export async function monthAvailabilityIndividual(
  db: Db,
  year: number,
  month: number,
): Promise<Record<string, boolean>> {
  const occupied = await loadOccupiedSlotKeysForMonth(db, year, month);
  const grid = buildPanelMonthGrid(year, month);
  const out: Record<string, boolean> = {};
  for (const cell of grid) {
    if (!cell.inMonth) continue;
    const wd = isoDateWeekday(cell.dateKey);
    if (wd === null) {
      out[cell.dateKey] = false;
      continue;
    }
    const templates = individualTemplatesForWeekday(wd);
    let any = false;
    for (const id of templates) {
      const tl = normalizeTimeLocal(timeForIndividualTemplate(id));
      if (!occupied.has(slotKey(cell.dateKey, tl))) {
        any = true;
        break;
      }
    }
    out[cell.dateKey] = any;
  }
  return out;
}

export async function daySlotsIndividual(
  db: Db,
  dateKey: string,
): Promise<{ value: string; label: string }[]> {
  const y = Number(dateKey.slice(0, 4));
  const m = Number(dateKey.slice(5, 7));
  const occupied = await loadOccupiedSlotKeysForMonth(db, y, m);
  const wd = isoDateWeekday(dateKey);
  if (wd === null) return [];
  const templates = individualTemplatesForWeekday(wd);
  const out: { value: string; label: string }[] = [];
  for (const id of templates) {
    const tl = normalizeTimeLocal(timeForIndividualTemplate(id));
    if (occupied.has(slotKey(dateKey, tl))) continue;
    out.push({
      value: JSON.stringify({ dateKey, timeLocal: tl, templateId: id }),
      label: formatDisplayFechaHora(dateKey, tl),
    });
  }
  return out;
}

/** Opciones de primera clase (ancla mar/jue) para una banda grupal, próximas `maxWeeks` semanas. */
export async function listGrupalAnclaOpciones(
  db: Db,
  horarioId: string,
  maxWeeks: number,
): Promise<{ value: string; label: string }[]> {
  if (!isHorarioGrupalId(horarioId)) return [];
  if (await isGrupalHorarioGloballyTaken(db, horarioId)) return [];

  const occupied = await loadOccupiedSlotKeysGlobal(db);
  const hid = horarioId as HorarioGrupalId;
  const out: { value: string; label: string }[] = [];

  const start = new Date();
  const fromKey = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-${String(start.getUTCDate()).padStart(2, "0")}`;

  for (let i = 0; i < maxWeeks * 7; i++) {
    const dk = addDays(fromKey, i);
    const w = isoDateWeekday(dk);
    if (w !== 2 && w !== 4) continue;
    if (grupalBandFree(occupied, hid, dk, 26)) {
      const tl = timeForGrupalTemplate(hid);
      out.push({
        value: dk,
        label: `${formatDisplayFechaHora(dk, tl)} · inicio ciclo mar/jue`,
      });
    }
  }
  return out;
}

function addDays(dateKey: string, delta: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return dateKey;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + delta);
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export async function daySlotsEvaluacionIgualIndividual(
  db: Db,
  dateKey: string,
): Promise<{ value: string; label: string }[]> {
  return daySlotsIndividual(db, dateKey);
}

/** Códigos de evaluación (lun_1600…) que aún admiten combo evaluación + ciclo grupal para `horarioGrupalId`. */
export async function listHorariosEvaluacionParaGrupal(
  db: Db,
  horarioGrupalId: string,
): Promise<string[]> {
  if (!isHorarioGrupalId(horarioGrupalId)) return [];
  if (await isGrupalHorarioGloballyTaken(db, horarioGrupalId)) return [];
  const occupied = await loadOccupiedSlotKeysGlobal(db);
  const fromKey = utcTodayDateKey();
  const hid = horarioGrupalId as HorarioGrupalId;
  const out: string[] = [];
  for (const hevId of HORARIOS_INDIVIDUAL) {
    if (!isHorarioIndividualId(hevId)) continue;
    if (hasGrupalEvalCombo(occupied, hid, hevId as HorarioIndividualId, fromKey)) {
      out.push(hevId);
    }
  }
  return out;
}

const INDIVIDUAL_SEARCH_WEEKS = 52;

/** Códigos lun_1600… con al menos un hueco libre (misma ventana que al confirmar la reserva). */
export async function listHorariosIndividualDisponibles(db: Db): Promise<string[]> {
  const occupied = await loadOccupiedSlotKeysGlobal(db);
  const fromKey = utcTodayDateKey();
  const out: string[] = [];
  for (const hid of HORARIOS_INDIVIDUAL) {
    if (!isHorarioIndividualId(hid)) continue;
    const id = hid as HorarioIndividualId;
    const occs = eachIndividualOccurrenceFrom(id, fromKey, INDIVIDUAL_SEARCH_WEEKS);
    if (occs.some((o) => isSlotFreePublic(occupied, o.dateKey, o.timeLocal))) {
      out.push(hid);
    }
  }
  return out;
}
