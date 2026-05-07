import type { Db, ObjectId } from "mongodb";

import { isHorarioGrupalId, type HorarioGrupalId } from "./wanda-schedule";

export const WANDA_GRUPAL_BLOQUEOS_COLLECTION = "wanda_grupal_bloqueos";

export type WandaGrupalBloqueoDoc = {
  _id: ObjectId;
  horarioId: HorarioGrupalId;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

let indexesApplied = 0;

export async function ensureWandaGrupalBloqueoIndexes(db: Db): Promise<void> {
  if (indexesApplied >= 1) return;
  const col = db.collection<WandaGrupalBloqueoDoc>(WANDA_GRUPAL_BLOQUEOS_COLLECTION);
  await col.createIndex({ horarioId: 1 }, { unique: true, name: "wgb_horario_unique" });
  indexesApplied = 1;
}

export async function isWandaGrupalHorarioBloqueado(db: Db, horarioId: string): Promise<boolean> {
  if (!isHorarioGrupalId(horarioId)) return false;
  await ensureWandaGrupalBloqueoIndexes(db);
  const hit = await db.collection<WandaGrupalBloqueoDoc>(WANDA_GRUPAL_BLOQUEOS_COLLECTION).findOne(
    { horarioId: horarioId as HorarioGrupalId },
    { projection: { _id: 1 } },
  );
  return Boolean(hit);
}

export async function setWandaGrupalHorarioBloqueado(
  db: Db,
  horarioId: string,
  note?: string | null,
): Promise<{ id: string }> {
  if (!isHorarioGrupalId(horarioId)) {
    throw new Error("HORARIO_INVALIDO");
  }
  await ensureWandaGrupalBloqueoIndexes(db);
  const now = new Date();
  const cleanNote = note?.trim() ? note.trim().slice(0, 500) : null;
  const res = await db.collection<WandaGrupalBloqueoDoc>(WANDA_GRUPAL_BLOQUEOS_COLLECTION).findOneAndUpdate(
    { horarioId: horarioId as HorarioGrupalId },
    {
      $set: {
        horarioId: horarioId as HorarioGrupalId,
        note: cleanNote,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  const id = res?._id?.toHexString();
  if (!id) throw new Error("BLOQUEO_NO_GUARDADO");
  return { id };
}

export async function removeWandaGrupalHorarioBloqueado(db: Db, horarioId: string): Promise<boolean> {
  if (!isHorarioGrupalId(horarioId)) return false;
  await ensureWandaGrupalBloqueoIndexes(db);
  const r = await db.collection<WandaGrupalBloqueoDoc>(WANDA_GRUPAL_BLOQUEOS_COLLECTION).deleteOne({
    horarioId: horarioId as HorarioGrupalId,
  });
  return r.deletedCount === 1;
}

export async function listWandaGrupalBloqueos(db: Db): Promise<
  { id: string; horarioId: HorarioGrupalId; note: string | null; createdAt: string; updatedAt: string }[]
> {
  await ensureWandaGrupalBloqueoIndexes(db);
  const rows = await db
    .collection<WandaGrupalBloqueoDoc>(WANDA_GRUPAL_BLOQUEOS_COLLECTION)
    .find({})
    .sort({ horarioId: 1 })
    .toArray();
  return rows.map((row) => ({
    id: row._id.toHexString(),
    horarioId: row.horarioId,
    note: row.note ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}
