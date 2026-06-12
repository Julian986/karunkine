import type { Db } from "mongodb";

let ensured = false;

export async function ensureTallerInscripcionIndexes(db: Db): Promise<void> {
  if (ensured) return;
  await db.collection("taller_inscripciones").createIndex(
    { externalReference: 1 },
    { unique: true, sparse: true },
  );
  await db.collection("taller_inscripciones").createIndex({ estado: 1, paymentExpiresAt: 1 });
  await db.collection("taller_inscripciones").createIndex({ eventoSlug: 1, createdAt: -1 });
  ensured = true;
}
