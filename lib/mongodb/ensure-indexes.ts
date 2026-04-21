import type { Db } from "mongodb";

let ensured = false;

/**
 * Índices para reservas y auditoría de webhooks (idempotencia y expiración).
 */
async function ensureTurnoBlockingSlotUniqueIndex(db: Db): Promise<void> {
  try {
    await db.collection("turnos").createIndex(
      { blockingSlotKeys: 1 },
      {
        unique: true,
        partialFilterExpression: {
          estado: {
            $in: ["pending_payment", "pendiente", "contactado", "confirmado"],
          },
          blockingSlotKeys: { $exists: true, $type: "array", $ne: [] },
        },
        name: "turnos_blockingSlotKeys_unique_active",
      }
    );
  } catch (e) {
    console.error(
      "[ensureTurnoBlockingSlotUniqueIndex] no se pudo crear el índice (p. ej. datos históricos con el mismo hueco en dos turnos activos):",
      e
    );
  }
}

export async function ensureReservaPaymentIndexes(db: Db): Promise<void> {
  if (ensured) return;
  await db.collection("turnos").createIndex({ externalReference: 1 }, { unique: true, sparse: true });
  await db.collection("turnos").createIndex({ estado: 1, paymentExpiresAt: 1 });
  await db.collection("turnos").createIndex({ "citas.dateKey": 1 }, { sparse: true, name: "turnos_citas_dateKey" });
  await ensureTurnoBlockingSlotUniqueIndex(db);
  await db.collection("mp_webhook_events").createIndex({ receivedAt: -1 });
  ensured = true;
}
