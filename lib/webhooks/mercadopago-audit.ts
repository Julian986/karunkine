import type { Collection, Db } from "mongodb";

export type WebhookAuditOutcome = "processed" | "duplicate" | "ignored" | "error";

export type WebhookAuditDoc = {
  receivedAt: Date;
  source: "get" | "post";
  topic: string | null;
  resourceId: string | null;
  payloadSummary: string;
  outcome: WebhookAuditOutcome;
  detail?: string;
  turnoId?: string;
  paymentId?: string;
};

const COLLECTION = "mp_webhook_events";

export function webhookAuditCollection(db: Db): Collection<WebhookAuditDoc> {
  return db.collection<WebhookAuditDoc>(COLLECTION);
}

export async function registrarEventoWebhook(
  db: Db,
  doc: WebhookAuditDoc
): Promise<void> {
  try {
    await webhookAuditCollection(db).insertOne(doc);
  } catch (e) {
    console.error("[mp-webhook] Fallo al persistir auditoría:", e);
  }
}
