import type { Db } from "mongodb";

let ensured = false;

/**
 * Índices para reservas y auditoría de webhooks (idempotencia y expiración).
 */
export async function ensureReservaPaymentIndexes(db: Db): Promise<void> {
  if (ensured) return;
  await db.collection("turnos").createIndex({ externalReference: 1 }, { unique: true, sparse: true });
  await db.collection("turnos").createIndex({ estado: 1, paymentExpiresAt: 1 });
  await db.collection("mp_webhook_events").createIndex({ receivedAt: -1 });
  ensured = true;
}
