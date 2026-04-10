import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/mongodb";
import { buildCheckoutItemCopy } from "../../../../../lib/mercadopago/checkout-item-copy";
import { crearPreferenciaCheckoutPro } from "../../../../../lib/mercadopago/preferences";
import { ensureReservaPaymentIndexes } from "../../../../../lib/mongodb/ensure-indexes";

export const runtime = "nodejs";

/**
 * Crea preferencia Checkout Pro para un turno `pending_payment` no vencido.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const oid = new ObjectId(id);

  try {
    const db = await getDb();
    await ensureReservaPaymentIndexes(db);

    const turno = await db.collection("turnos").findOne({ _id: oid });
    if (!turno) {
      return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
    }

    if (turno.estado !== "pending_payment") {
      return NextResponse.json(
        { error: "La reserva no está pendiente de pago.", estado: String(turno.estado) },
        { status: 409 }
      );
    }

    const exp = turno.paymentExpiresAt ? new Date(turno.paymentExpiresAt) : null;
    if (exp && exp.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "La reserva expiró. Creá una nueva reserva." },
        { status: 410 }
      );
    }

    const externalReference = String(turno.externalReference ?? id);
    if (externalReference !== id) {
      return NextResponse.json({ error: "Referencia externa inconsistente." }, { status: 500 });
    }

    const precio = Number(turno.precioReferenciaArs ?? 0);
    if (!Number.isFinite(precio) || precio <= 0) {
      return NextResponse.json({ error: "Monto inválido en la reserva." }, { status: 500 });
    }

    const modalidad =
      turno.modalidad === "consulta_individual"
        ? "consulta_individual"
        : "grupal";
    const formatoRaw = turno.formatoConsulta;
    const formatoConsulta =
      formatoRaw === "presencial" || formatoRaw === "virtual"
        ? formatoRaw
        : null;

    const { tituloItem, descripcionItem } = buildCheckoutItemCopy({
      modalidad,
      turnoDetalle: String(turno.turnoDetalle ?? ""),
      formatoConsulta,
    });

    const { preferenceId, initPoint } = await crearPreferenciaCheckoutPro({
      externalReference,
      tituloItem,
      descripcionItem,
      precioArs: Math.round(precio),
      nombrePagador: String(turno.nombre ?? "Cliente"),
      emailPagador: String(turno.mail ?? ""),
    });

    await db.collection("turnos").updateOne(
      { _id: oid, estado: "pending_payment" },
      {
        $set: {
          mpPreferenceId: preferenceId,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      ok: true,
      preferenceId,
      initPoint,
      externalReference,
    });
  } catch (e) {
    console.error("[reservas/preferencia]", id, e);
    const message = e instanceof Error ? e.message : "Error al crear preferencia.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
