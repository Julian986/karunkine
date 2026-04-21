import type { Db, ObjectId } from "mongodb";
import { ObjectId as ObjectIdCtor } from "mongodb";

import { agendaBlockAppliesToDateKey, type AgendaBlockRule } from "../booking/agenda-blocks-shared";
import { buildPanelMonthGrid } from "../booking/panel-month-grid";
import { normalizeTimeLocal, slotKey } from "./wanda-schedule";

export const WANDA_AGENDA_BLOCKS_COLLECTION = "wanda_agenda_blocks";

export type WandaAgendaBlockDoc = {
  _id: ObjectId;
  anchorDateKey: string;
  timeLocal: string;
  durationMinutes: number;
  recurrence: null | { type: "weekly"; untilDateKey?: string | null };
  notes?: string | null;
  createdAt: Date;
};

let indexesApplied = 0;

export async function ensureWandaAgendaBlockIndexes(db: Db) {
  if (indexesApplied >= 1) return;
  const col = db.collection(WANDA_AGENDA_BLOCKS_COLLECTION);
  await col.createIndex({ anchorDateKey: 1 }, { name: "wab_anchor" });
  indexesApplied = 1;
}

export async function listWandaAgendaBlocksForMonth(
  db: Db,
  year: number,
  month: number,
): Promise<WandaAgendaBlockDoc[]> {
  await ensureWandaAgendaBlockIndexes(db);
  const grid = buildPanelMonthGrid(year, month);
  const inMonthKeys = new Set(grid.filter((c) => c.inMonth).map((c) => c.dateKey));
  const col = db.collection<WandaAgendaBlockDoc>(WANDA_AGENDA_BLOCKS_COLLECTION);
  const rows = await col.find({}).sort({ anchorDateKey: -1 }).limit(400).toArray();
  return rows.filter((doc) =>
    [...inMonthKeys].some((dk) => agendaBlockAppliesToDateKey(doc as AgendaBlockRule, dk)),
  );
}

export function blockToPanelShape(doc: WandaAgendaBlockDoc) {
  return {
    id: doc._id.toHexString(),
    anchorDateKey: doc.anchorDateKey,
    timeLocal: doc.timeLocal,
    durationMinutes: doc.durationMinutes,
    scope: "agenda",
    recurrence: doc.recurrence,
    notes: doc.notes ?? null,
  };
}

export async function insertWandaAgendaBlock(
  db: Db,
  input: {
    anchorDateKey: string;
    timeLocal: string;
    durationMinutes: number;
    recurrence: null | { type: "weekly"; untilDateKey?: string | null };
    notes?: string | null;
  },
): Promise<{ id: string }> {
  await ensureWandaAgendaBlockIndexes(db);
  const now = new Date();
  const doc: WandaAgendaBlockDoc = {
    _id: new ObjectIdCtor(),
    anchorDateKey: input.anchorDateKey,
    timeLocal: input.timeLocal,
    durationMinutes: input.durationMinutes,
    recurrence: input.recurrence,
    notes: input.notes ?? null,
    createdAt: now,
  };
  await db.collection(WANDA_AGENDA_BLOCKS_COLLECTION).insertOne(doc);
  return { id: doc._id.toHexString() };
}

export async function deleteWandaAgendaBlockById(db: Db, hexId: string): Promise<boolean> {
  try {
    const _id = new ObjectIdCtor(hexId);
    const r = await db.collection(WANDA_AGENDA_BLOCKS_COLLECTION).deleteOne({ _id });
    return r.deletedCount === 1;
  } catch {
    return false;
  }
}

/** Claves `dateKey|HH:mm` bloqueadas en el mes (inicio de franja). */
export function occupiedSlotKeysFromBlocksInMonth(
  blocks: WandaAgendaBlockDoc[],
  year: number,
  month: number,
): Set<string> {
  const set = new Set<string>();
  const grid = buildPanelMonthGrid(year, month);
  for (const cell of grid) {
    if (!cell.inMonth) continue;
    for (const b of blocks) {
      if (!agendaBlockAppliesToDateKey(b as AgendaBlockRule, cell.dateKey)) continue;
      set.add(slotKey(cell.dateKey, normalizeTimeLocal(b.timeLocal)));
    }
  }
  return set;
}
