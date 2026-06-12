import { ObjectId } from "mongodb";
import { obtenerPagoPorId } from "../mercadopago/payments";
import { MercadoPagoApiError } from "../mercadopago/http";
import { getDb } from "../mongodb";
import type { WebhookAuditOutcome } from "./mercadopago-audit";
import { registrarEventoWebhook } from "./mercadopago-audit";
import { procesarNotificacionPagoTallerInscripcion } from "./procesar-notificacion-pago-taller";

export type ProcesarPagoResult = {
  outcome: WebhookAuditOutcome;
  detail: string;
  turnoId?: string;
  paymentId?: string;
};

/**
 * Confirma reserva solo si MP devuelve pago `approved`, external_reference válido
 * y monto coincide con la reserva. Idempotente si ya está confirmado.
 */
export async function procesarNotificacionPagoId(
  paymentId: string,
  audit: {
    source: "get" | "post";
    topic: string | null;
    payloadSummary: string;
  }
): Promise<ProcesarPagoResult> {
  const db = await getDb();
  const pid = String(paymentId).trim();
  if (!/^\d+$/.test(pid)) {
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "ignored",
      detail: "payment id inválido",
    });
    return { outcome: "ignored", detail: "payment id inválido", paymentId: pid };
  }

  let pago;
  try {
    pago = await obtenerPagoPorId(pid);
  } catch (e) {
    const detail =
      e instanceof MercadoPagoApiError ? `MP API ${e.status}: ${e.body?.slice(0, 200)}` : String(e);
    console.error("[mp-webhook] Error al consultar pago", pid, detail);
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "error",
      detail,
      paymentId: pid,
    });
    return { outcome: "error", detail, paymentId: pid };
  }

  const extRef = pago.external_reference?.trim() ?? "";
  if (!extRef || !ObjectId.isValid(extRef)) {
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "ignored",
      detail: "external_reference vacío o no ObjectId",
      paymentId: pid,
    });
    return { outcome: "ignored", detail: "external_reference inválido", paymentId: pid };
  }

  const turnoOid = new ObjectId(extRef);

  const esInscripcionTaller = await db.collection("taller_inscripciones").findOne(
    { _id: turnoOid },
    { projection: { _id: 1 } },
  );
  if (esInscripcionTaller) {
    return procesarNotificacionPagoTallerInscripcion(pago, turnoOid, extRef, pid, audit);
  }

  const status = (pago.status ?? "").toLowerCase();

  if (status !== "approved") {
    await db.collection("turnos").updateOne(
      { _id: turnoOid },
      {
        $set: {
          mpPaymentId: pago.id != null ? String(pago.id) : pid,
          mpPaymentStatus: pago.status ?? "unknown",
          mpLastNotificationAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "ignored",
      detail: `pago no aprobado: ${pago.status}`,
      turnoId: extRef,
      paymentId: pid,
    });
    return {
      outcome: "ignored",
      detail: `status=${pago.status}`,
      turnoId: extRef,
      paymentId: pid,
    };
  }

  const montoMp = Number(pago.transaction_amount);
  const currency = (pago.currency_id ?? "ARS").toUpperCase();
  if (currency !== "ARS") {
    console.error("[mp-webhook] Moneda inesperada", currency, pid);
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "error",
      detail: `currency_id ${currency}`,
      turnoId: extRef,
      paymentId: pid,
    });
    return { outcome: "error", detail: "moneda no ARS", turnoId: extRef, paymentId: pid };
  }

  const turno = await db.collection("turnos").findOne({ _id: turnoOid });

  if (!turno) {
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "error",
      detail: "turno no encontrado para external_reference",
      turnoId: extRef,
      paymentId: pid,
    });
    return { outcome: "error", detail: "turno no encontrado", turnoId: extRef, paymentId: pid };
  }

  const precioEsperado = Number(turno.precioReferenciaArs ?? 0);
  if (!Number.isFinite(montoMp) || Math.round(montoMp) !== Math.round(precioEsperado)) {
    console.error(
      "[mp-webhook] Monto no coincide",
      { montoMp, precioEsperado, turnoId: extRef, paymentId: pid }
    );
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "error",
      detail: `monto MP ${montoMp} !== precio reserva ${precioEsperado}`,
      turnoId: extRef,
      paymentId: pid,
    });
    return { outcome: "error", detail: "monto no coincide", turnoId: extRef, paymentId: pid };
  }

  if (turno.externalReference && turno.externalReference !== extRef) {
    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "error",
      detail: "external_reference distinto al guardado en turno",
      turnoId: extRef,
      paymentId: pid,
    });
    return { outcome: "error", detail: "external_reference mismatch", turnoId: extRef, paymentId: pid };
  }

  const now = new Date();
  const updateResult = await db.collection("turnos").updateOne(
    {
      _id: turnoOid,
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
    }
  );

  if (updateResult.matchedCount === 0) {
    const actual = await db.collection("turnos").findOne(
      { _id: turnoOid },
      { projection: { estado: 1 } }
    );
    if (actual?.estado === "confirmado") {
      await db.collection("turnos").updateOne(
        { _id: turnoOid },
        {
          $set: {
            mpPaymentId: pago.id != null ? String(pago.id) : pid,
            mpLastNotificationAt: now,
            updatedAt: now,
          },
        }
      );
      await registrarEventoWebhook(db, {
        receivedAt: new Date(),
        source: audit.source,
        topic: audit.topic,
        resourceId: pid,
        payloadSummary: audit.payloadSummary,
        outcome: "duplicate",
        detail: "ya confirmado — idempotente",
        turnoId: extRef,
        paymentId: pid,
      });
      return {
        outcome: "duplicate",
        detail: "ya confirmado",
        turnoId: extRef,
        paymentId: pid,
      };
    }

    if (actual?.estado === "expirado" || actual?.estado === "cancelado") {
      await registrarEventoWebhook(db, {
        receivedAt: new Date(),
        source: audit.source,
        topic: audit.topic,
        resourceId: pid,
        payloadSummary: audit.payloadSummary,
        outcome: "ignored",
        detail: `no se confirma: estado turno=${actual?.estado}`,
        turnoId: extRef,
        paymentId: pid,
      });
      return {
        outcome: "ignored",
        detail: `estado ${String(actual?.estado)}`,
        turnoId: extRef,
        paymentId: pid,
      };
    }

    await registrarEventoWebhook(db, {
      receivedAt: new Date(),
      source: audit.source,
      topic: audit.topic,
      resourceId: pid,
      payloadSummary: audit.payloadSummary,
      outcome: "error",
      detail: "no pending_payment o precio distinto",
      turnoId: extRef,
      paymentId: pid,
    });
    return {
      outcome: "error",
      detail: "no actualizable a confirmado",
      turnoId: extRef,
      paymentId: pid,
    };
  }

  await registrarEventoWebhook(db, {
    receivedAt: new Date(),
    source: audit.source,
    topic: audit.topic,
    resourceId: pid,
    payloadSummary: audit.payloadSummary,
    outcome: "processed",
    detail: "confirmado",
    turnoId: extRef,
    paymentId: pid,
  });

  return { outcome: "processed", detail: "confirmado", turnoId: extRef, paymentId: pid };
}
