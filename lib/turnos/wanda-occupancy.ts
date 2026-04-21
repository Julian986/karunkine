import type { Db } from "mongodb";

import { dateKeysBetweenInclusive } from "./wanda-schedule";
import {
  eachIndividualOccurrenceFrom,
  expandGrupalCitas,
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

const BLOCKING_ESTADOS = new Set([
  "pending_payment",
  "pendiente",
  "contactado",
  "confirmado",
]);

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayDateKeyUtcNoon(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

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

function legacyGrupalSlotKeys(row: { horario?: string; createdAt?: Date }): string[] {
  if (!row.horario || !isHorarioGrupalId(row.horario)) return [];
  const from = todayDateKeyUtcNoon();
  const to = (() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(from);
    if (!m) return from;
    const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + 365);
    const d = new Date(t);
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  })();
  const range = dateKeysBetweenInclusive(from, to);
  const t = normalizeTimeLocal(timeForGrupalTemplate(row.horario));
  const keys: string[] = [];
  for (const dk of range) {
    const w = isoDateWeekday(dk);
    if (w === 2 || w === 4) keys.push(slotKey(dk, t));
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
        if (c?.dateKey && c?.timeLocal) {
          set.add(slotKey(String(c.dateKey).trim(), normalizeTimeLocal(String(c.timeLocal))));
        }
      }
    } else {
      for (const k of legacyIndividualSlotKeys(row as { horario?: string; horarioEvaluacion?: string; modalidad?: string })) {
        set.add(k);
      }
      if ((row as { modalidad?: string }).modalidad === "grupal") {
        for (const k of legacyGrupalSlotKeys(row as { horario?: string; createdAt?: Date })) {
          set.add(k);
        }
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

export async function isGrupalHorarioGloballyTaken(db: Db, horarioId: string): Promise<boolean> {
  const col = db.collection("turnos");
  const n = await col.countDocuments({
    estado: { $in: [...BLOCKING_ESTADOS] },
    modalidad: "grupal",
    horario: horarioId,
  });
  return n > 0;
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
