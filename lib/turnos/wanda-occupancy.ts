import type { Db, ObjectId } from "mongodb";

import {
  eachIndividualOccurrenceFrom,
  expandGrupalCitas,
  GRUPAL_CUPO_MAX_POR_BANDA,
  HORARIOS_GRUPAL_IDS,
  isHorarioGrupalId,
  isHorarioIndividualId,
  isoDateWeekday,
  matchIndividualTemplate,
  normalizeTimeLocal,
  slotKey,
  timeForGrupalTemplate,
  utcTodayDateKey,
  type CitaDoc,
  type HorarioIndividualId,
} from "./wanda-schedule";
import {
  WANDA_AGENDA_BLOCKS_COLLECTION,
  ensureWandaAgendaBlockIndexes,
  listWandaAgendaBlocksForMonth,
  occupiedSlotKeysFromBlocksInMonth,
  type WandaAgendaBlockDoc,
} from "./wanda-agenda-blocks";
import { isWandaGrupalHorarioBloqueado } from "./wanda-grupal-bloqueos";

const BLOCKING_ESTADOS = new Set([
  "pending_payment",
  "pendiente",
  "contactado",
  "confirmado",
]);

/**
 * Turnos sin `citas`: bloqueamos la **próxima** ocurrencia del template desde hoy (UTC),
 * alineado con la vista del panel (`legacyPreviewCita` usa “desde hoy”).
 */
function legacyIndividualSlotKeys(row: {
  horario?: string;
  horarioEvaluacion?: string;
  modalidad?: string;
}): string[] {
  const keys: string[] = [];
  const fromToday = utcTodayDateKey();

  if (row.modalidad === "consulta_individual" && row.horario && isHorarioIndividualId(row.horario)) {
    const id = row.horario as HorarioIndividualId;
    const occ = eachIndividualOccurrenceFrom(id, fromToday, 104);
    const first = occ[0];
    if (first) keys.push(slotKey(first.dateKey, normalizeTimeLocal(first.timeLocal)));
  }

  if (row.modalidad === "grupal" && row.horarioEvaluacion && isHorarioIndividualId(row.horarioEvaluacion)) {
    const id = row.horarioEvaluacion as HorarioIndividualId;
    const occ = eachIndividualOccurrenceFrom(id, fromToday, 104);
    const first = occ[0];
    if (first) keys.push(slotKey(first.dateKey, normalizeTimeLocal(first.timeLocal)));
  }

  return keys;
}

export async function loadOccupiedSlotKeysGlobal(db: Db): Promise<Set<string>> {
  const col = db.collection("turnos");
  const rows = await col
    .find({ estado: { $in: [...BLOCKING_ESTADOS] } })
    .project({
      citas: 1,
      modalidad: 1,
      horario: 1,
      horarioEvaluacion: 1,
    })
    .limit(8000)
    .toArray();

  const set = new Set<string>();
  for (const row of rows) {
    const citas = row.citas as CitaDoc[] | undefined;
    if (Array.isArray(citas) && citas.length > 0) {
      for (const c of citas) {
        const doc = c as CitaDoc;
        if (doc.tipo === "clase_grupal") continue;
        if (c?.dateKey && c?.timeLocal) {
          set.add(slotKey(String(c.dateKey).trim(), normalizeTimeLocal(String(c.timeLocal))));
        }
      }
    } else {
      for (const k of legacyIndividualSlotKeys(row as { horario?: string; horarioEvaluacion?: string; modalidad?: string })) {
        set.add(k);
      }
    }
  }

  await ensureWandaAgendaBlockIndexes(db);
  const blockRows = await db
    .collection<WandaAgendaBlockDoc>(WANDA_AGENDA_BLOCKS_COLLECTION)
    .find({})
    .limit(500)
    .toArray();
  if (blockRows.length > 0) {
    const now = new Date();
    let y = now.getUTCFullYear();
    let mo = now.getUTCMonth() + 1;
    for (let i = 0; i < 24; i++) {
      for (const k of occupiedSlotKeysFromBlocksInMonth(blockRows, y, mo)) {
        set.add(k);
      }
      mo += 1;
      if (mo > 12) {
        mo = 1;
        y += 1;
      }
    }
  }

  return set;
}

/** Igual que `loadOccupiedSlotKeysGlobal` pero ignora un turno (p. ej. al reprogramar el propio). */
export async function loadOccupiedSlotKeysGlobalExcludingTurno(
  db: Db,
  excludeTurnoId: ObjectId,
): Promise<Set<string>> {
  const col = db.collection("turnos");
  const rows = await col
    .find({ estado: { $in: [...BLOCKING_ESTADOS] }, _id: { $ne: excludeTurnoId } })
    .project({
      citas: 1,
      modalidad: 1,
      horario: 1,
      horarioEvaluacion: 1,
    })
    .limit(8000)
    .toArray();

  const set = new Set<string>();
  for (const row of rows) {
    const citas = row.citas as CitaDoc[] | undefined;
    if (Array.isArray(citas) && citas.length > 0) {
      for (const c of citas) {
        const doc = c as CitaDoc;
        if (doc.tipo === "clase_grupal") continue;
        if (c?.dateKey && c?.timeLocal) {
          set.add(slotKey(String(c.dateKey).trim(), normalizeTimeLocal(String(c.timeLocal))));
        }
      }
    } else {
      for (const k of legacyIndividualSlotKeys(row as { horario?: string; horarioEvaluacion?: string; modalidad?: string })) {
        set.add(k);
      }
    }
  }

  await ensureWandaAgendaBlockIndexes(db);
  const blockRows = await db
    .collection<WandaAgendaBlockDoc>(WANDA_AGENDA_BLOCKS_COLLECTION)
    .find({})
    .limit(500)
    .toArray();
  if (blockRows.length > 0) {
    const now = new Date();
    let y = now.getUTCFullYear();
    let mo = now.getUTCMonth() + 1;
    for (let i = 0; i < 24; i++) {
      for (const k of occupiedSlotKeysFromBlocksInMonth(blockRows, y, mo)) {
        set.add(k);
      }
      mo += 1;
      if (mo > 12) {
        mo = 1;
        y += 1;
      }
    }
  }

  return set;
}

/** True cuando la banda grupal (`horario`) ya alcanzó el cupo máximo de reservas activas. */
export async function isGrupalBandaSinCupo(db: Db, horarioId: string): Promise<boolean> {
  if (await isWandaGrupalHorarioBloqueado(db, horarioId)) {
    return true;
  }
  const col = db.collection("turnos");
  const n = await col.countDocuments({
    estado: { $in: [...BLOCKING_ESTADOS] },
    modalidad: "grupal",
    horario: horarioId,
  });
  return n >= GRUPAL_CUPO_MAX_POR_BANDA;
}

export async function loadOccupiedSlotKeysForMonth(
  db: Db,
  year: number,
  month: number,
): Promise<Set<string>> {
  const global = await loadOccupiedSlotKeysGlobal(db);
  const blocks = await listWandaAgendaBlocksForMonth(db, year, month);
  const fromBlocks = occupiedSlotKeysFromBlocksInMonth(blocks, year, month);
  return new Set([...global, ...fromBlocks]);
}

/** Igual que `loadOccupiedSlotKeysForMonth` pero sin citas del turno que se está reprogramando. */
export async function loadOccupiedSlotKeysForMonthExcludingTurno(
  db: Db,
  year: number,
  month: number,
  excludeTurnoId: ObjectId,
): Promise<Set<string>> {
  const global = await loadOccupiedSlotKeysGlobalExcludingTurno(db, excludeTurnoId);
  const blocks = await listWandaAgendaBlocksForMonth(db, year, month);
  const fromBlocks = occupiedSlotKeysFromBlocksInMonth(blocks, year, month);
  return new Set([...global, ...fromBlocks]);
}

/** True si la banda grupal (todas las citas expandidas) está libre vs ocupación actual. */
export function grupalBandFree(
  occupied: Set<string>,
  horarioId: (typeof HORARIOS_GRUPAL_IDS)[number],
  anchorMarOrJueDateKey: string,
  weeks: number,
): boolean {
  const citas = expandGrupalCitas({ horarioId, anchorMarOrJueDateKey, weeks });
  for (const c of citas) {
    if (occupied.has(slotKey(c.dateKey, c.timeLocal))) return false;
  }
  return true;
}

export function isSlotFreePublic(
  occupied: Set<string>,
  dateKey: string,
  timeLocal: string,
): boolean {
  return !occupied.has(slotKey(dateKey, normalizeTimeLocal(timeLocal)));
}

export function assertIndividualSlotMatchesTemplate(dateKey: string, timeLocal: string): boolean {
  return matchIndividualTemplate(dateKey, timeLocal) !== null;
}
