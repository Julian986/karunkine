import { obtenerMerchantOrder } from "../mercadopago/payments";
import { MercadoPagoApiError } from "../mercadopago/http";
import { getDb } from "../mongodb";
import { registrarEventoWebhook } from "./mercadopago-audit";
import { procesarNotificacionPagoId, type ProcesarPagoResult } from "./procesar-notificacion-pago";

/**
 * Checkout Pro puede notificar `merchant_order`. Se consulta la orden y se procesa cada pago.
 */
export async function procesarNotificacionMerchantOrder(
  orderId: string,
  auditBase: { source: "get" | "post"; payloadSummary: string }
): Promise<ProcesarPagoResult[]> {
  const db = await getDb();
  const oid = String(orderId).trim();

  let order;
  try {
    order = await obtenerMerchantOrder(oid);
  } catch (e) {
    const detail =
      e instanceof MercadoPagoApiError ? `MP API ${e.status}` : String(e);
    console.error("[mp-webhook] merchant_order fetch error", oid, detail);
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: auditBase.source,
      topic: "merchant_order",
      resourceId: oid,
      payloadSummary: auditBase.payloadSummary,
      outcome: "error",
      detail,
    });
    return [{ outcome: "error", detail }];
  }

  const payments = order.payments ?? [];
  const results: ProcesarPagoResult[] = [];

  for (const p of payments) {
    const pid = p.id != null ? String(p.id) : "";
    if (!pid) continue;
    const r = await procesarNotificacionPagoId(pid, {
      source: auditBase.source,
      topic: "payment",
      payloadSummary: `${auditBase.payloadSummary} | order=${oid}`,
    });
    results.push(r);
  }

  if (results.length === 0) {
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: auditBase.source,
      topic: "merchant_order",
      resourceId: oid,
      payloadSummary: auditBase.payloadSummary,
      outcome: "ignored",
      detail: "orden sin payments con id",
    });
    results.push({ outcome: "ignored", detail: "sin pagos en orden" });
  }

  return results;
}
