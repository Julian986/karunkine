import { NextResponse } from "next/server";
import { procesarNotificacionPagoId } from "../../../../lib/webhooks/procesar-notificacion-pago";
import { procesarNotificacionMerchantOrder } from "../../../../lib/webhooks/procesar-merchant-order";

export const runtime = "nodejs";

/**
 * Webhook / IPN Mercado Pago (notification_url).
 * No confiar para confirmar negocio: solo tras GET /v1/payments/{id} con status approved.
 *
 * @see https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const topic = (url.searchParams.get("topic") || url.searchParams.get("type") || "").toLowerCase();
  const resourceId =
    url.searchParams.get("id") ||
    url.searchParams.get("data.id") ||
    "";

  const payloadSummary = `GET topic=${topic} id=${resourceId}`;

  if (!topic || !resourceId) {
    console.warn("[mp-webhook] GET sin topic o id", payloadSummary);
    return new NextResponse(null, { status: 200 });
  }

  try {
    if (topic === "payment") {
      await procesarNotificacionPagoId(resourceId, {
        source: "get",
        topic,
        payloadSummary,
      });
    } else if (topic === "merchant_order") {
      await procesarNotificacionMerchantOrder(resourceId, {
        source: "get",
        payloadSummary,
      });
    } else {
      console.info("[mp-webhook] GET topic no manejado", topic, resourceId);
    }
  } catch (e) {
    console.error("[mp-webhook] GET error no controlado", e);
  }

  return new NextResponse(null, { status: 200 });
}

export async function POST(request: Request) {
  let topic = "";
  let resourceId = "";
  let raw = "";

  try {
    raw = await request.text();
    if (raw) {
      const j = JSON.parse(raw) as {
        type?: string;
        topic?: string;
        action?: string;
        data?: { id?: string | number };
      };
      topic = String(j.type || j.topic || "").toLowerCase();
      if (!topic && typeof j.action === "string" && j.action.toLowerCase().startsWith("payment.")) {
        topic = "payment";
      }
      resourceId = j.data?.id != null ? String(j.data.id) : "";
    }
  } catch {
    console.warn("[mp-webhook] POST body no JSON");
  }

  const payloadSummary = `POST len=${raw.length} topic=${topic} id=${resourceId}`;

  if (!topic || !resourceId) {
    console.warn("[mp-webhook] POST incompleto", payloadSummary);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    if (topic === "payment" || topic === "payment_created" || topic === "payment_updated") {
      const normalizedTopic = topic.startsWith("payment") ? "payment" : topic;
      await procesarNotificacionPagoId(resourceId, {
        source: "post",
        topic: normalizedTopic,
        payloadSummary: `${payloadSummary} raw=${raw.slice(0, 500)}`,
      });
    } else if (topic === "merchant_order") {
      await procesarNotificacionMerchantOrder(resourceId, {
        source: "post",
        payloadSummary: `${payloadSummary} raw=${raw.slice(0, 500)}`,
      });
    } else {
      console.info("[mp-webhook] POST topic no manejado", topic, resourceId);
    }
  } catch (e) {
    console.error("[mp-webhook] POST error no controlado", e);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
