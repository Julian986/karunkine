import type { Db } from "mongodb";

export async function ensureCapsulasInscripcionIndexes(db: Db): Promise<void> {
  await db.collection("capsulas_inscripciones").createIndex({ estado: 1, paymentExpiresAt: 1 });
  await db.collection("capsulas_inscripciones").createIndex({ cicloSlug: 1, createdAt: -1 });
  await db.collection("capsulas_inscripciones").createIndex({ capsulaIds: 1, estado: 1 });
  await db.collection("capsulas_inscripciones").createIndex({ celularDigits: 1, createdAt: -1 });
}
