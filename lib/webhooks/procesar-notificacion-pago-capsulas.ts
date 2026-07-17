import { ObjectId } from "mongodb";

import type { MercadoPagoPayment } from "../mercadopago/types";
import { getDb } from "../mongodb";
import { registrarEventoWebhook } from "./mercadopago-audit";
import type { ProcesarPagoResult } from "./procesar-notificacion-pago";

export async function procesarNotificacionPagoCapsulasInscripcion(
  pago: MercadoPagoPayment,
  inscripcionOid: ObjectId,
  extRef: string,
  pid: string,
  audit: {
    source: "get" | "post";
    topic: string | null;
    payloadSummary: string;
  },
): Promise<ProcesarPagoResult> {
  const db = await getDb();
  const status = (pago.status ?? "").toLowerCase();

  if (status !== "approved") {
    await db.collection("capsulas_inscripciones").updateOne(
      { _id: inscripcionOid },
      {
        $set: {
          mpPaymentId: pago.id != null ? String(pago.id) : pid,
          mpPaymentStatus: pago.status ?? "unknown",
          mpLastNotificationAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "ignored",
      detail: `inscripción cápsulas: pago no aprobado: ${pago.status}`,
      turnoId: extRef,
      paymentId: pid,
    });
    return { outcome: "ignored", detail: `status=${pago.status}`, turnoId: extRef, paymentId: pid };
  }

  const montoMp = Number(pago.transaction_amount);
  const currency = (pago.currency_id ?? "ARS").toUpperCase();
  if (currency !== "ARS") {
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "error",
      detail: `inscripción cápsulas: currency_id ${currency}`,
      turnoId: extRef,
      paymentId: pid,
    });
    return { outcome: "error", detail: "moneda no ARS", turnoId: extRef, paymentId: pid };
  }

  const inscripcion = await db.collection("capsulas_inscripciones").findOne({ _id: inscripcionOid });
  if (!inscripcion) {
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "error",
      detail: "inscripción cápsulas no encontrada",
      turnoId: extRef,
      paymentId: pid,
    });
    return { outcome: "error", detail: "inscripción no encontrada", turnoId: extRef, paymentId: pid };
  }

  const precioEsperado = Number(inscripcion.precioReferenciaArs ?? 0);
  if (!Number.isFinite(montoMp) || Math.round(montoMp) !== Math.round(precioEsperado)) {
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "error",
      detail: `inscripción cápsulas: monto MP ${montoMp} !== ${precioEsperado}`,
      turnoId: extRef,
      paymentId: pid,
    });
    return { outcome: "error", detail: "monto no coincide", turnoId: extRef, paymentId: pid };
  }

  const now = new Date();
  const updateResult = await db.collection("capsulas_inscripciones").updateOne(
    {
      _id: inscripcionOid,
      estado: "pending_payment",
      precioReferenciaArs: precioEsperado,
    },
    {
      $set: {
        estado: "confirmado",
        mpPaymentId: pago.id != null ? String(pago.id) : pid,
        mpPaymentStatus: "approved",
        mpLastNotificationAt: now,
        confirmedAt: now,
        updatedAt: now,
      },
    },
  );

  if (updateResult.matchedCount === 0) {
    const actual = await db.collection("capsulas_inscripciones").findOne(
      { _id: inscripcionOid },
      { projection: { estado: 1 } },
    );
    if (actual?.estado === "confirmado") {
      await db.collection("capsulas_inscripciones").updateOne(
        { _id: inscripcionOid },
        { $set: { mpPaymentId: pago.id != null ? String(pago.id) : pid, mpLastNotificationAt: now, updatedAt: now } },
      );
      await registrarEventoWebhook(db, {
        receivedAt: new Date(),
        source: audit.source,
        topic: audit.topic,
        resourceId: pid,
        payloadSummary: audit.payloadSummary,
        outcome: "duplicate",
        detail: "inscripción cápsulas ya confirmada",
        turnoId: extRef,
        paymentId: pid,
      });
      return { outcome: "duplicate", detail: "ya confirmado", turnoId: extRef, paymentId: pid };
    }
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "error",
      detail: "inscripción cápsulas no actualizable",
      turnoId: extRef,
      paymentId: pid,
    });
    return { outcome: "error", detail: "no actualizable a confirmado", turnoId: extRef, paymentId: pid };
  }

  await registrarEventoWebhook(db, {
    receivedAt: new Date(),
    source: audit.source,
    topic: audit.topic,
    resourceId: pid,
    payloadSummary: audit.payloadSummary,
    outcome: "processed",
    detail: "inscripción cápsulas confirmada",
    turnoId: extRef,
    paymentId: pid,
  });

  return { outcome: "processed", detail: "inscripción confirmada", turnoId: extRef, paymentId: pid };
}
