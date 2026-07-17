import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import { buildCapsulasCheckoutItemCopy } from "../../../../../../lib/capsulas/checkout-copy";
import { getCapsulasCicloBySlug } from "../../../../../../lib/capsulas/config";
import { getAppPublicBaseUrl } from "../../../../../../lib/mercadopago/env";
import { crearPreferenciaCheckoutPro } from "../../../../../../lib/mercadopago/preferences";
import { SITE_CONTACT } from "../../../../../../lib/site-contact";
import { getDb } from "../../../../../../lib/mongodb";
import { ensureCapsulasInscripcionIndexes } from "../../../../../../lib/mongodb/ensure-capsulas-indexes";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const oid = new ObjectId(id);

  try {
    const db = await getDb();
    await ensureCapsulasInscripcionIndexes(db);

    const inscripcion = await db.collection("capsulas_inscripciones").findOne({ _id: oid });
    if (!inscripcion) {
      return NextResponse.json({ error: "Inscripción no encontrada." }, { status: 404 });
    }
    if (inscripcion.estado !== "pending_payment") {
      return NextResponse.json(
        { error: "La inscripción no está pendiente de pago.", estado: String(inscripcion.estado) },
        { status: 409 },
      );
    }

    const exp = inscripcion.paymentExpiresAt ? new Date(inscripcion.paymentExpiresAt) : null;
    if (exp && exp.getTime() < Date.now()) {
      return NextResponse.json({ error: "La inscripción expiró. Completá el formulario de nuevo." }, { status: 410 });
    }

    const externalReference = String(inscripcion.externalReference ?? id);
    if (externalReference !== id) {
      return NextResponse.json({ error: "Referencia externa inconsistente." }, { status: 500 });
    }

    const ciclo = getCapsulasCicloBySlug(String(inscripcion.cicloSlug ?? ""));
    if (!ciclo) {
      return NextResponse.json({ error: "Ciclo no configurado." }, { status: 500 });
    }

    const precio = Number(inscripcion.precioReferenciaArs ?? 0);
    const esperado = ciclo.precioArs * (inscripcion.capsulas?.length ?? 0);
    if (!Number.isFinite(precio) || precio <= 0 || Math.round(precio) !== Math.round(esperado)) {
      return NextResponse.json({ error: "Monto inválido en la inscripción." }, { status: 500 });
    }

    const { tituloItem, descripcionItem } = buildCapsulasCheckoutItemCopy(ciclo, inscripcion.capsulas ?? []);
    const mail = String(inscripcion.mail ?? "").trim();
    const base = getAppPublicBaseUrl();

    const { preferenceId, initPoint } = await crearPreferenciaCheckoutPro({
      externalReference,
      tituloItem,
      descripcionItem,
      precioArs: Math.round(precio),
      nombrePagador: String(inscripcion.nombre ?? "Cliente"),
      emailPagador: mail || SITE_CONTACT.email,
      backUrls: {
        success: `${base}/reserva/resultado?estado=success&origen=capsulas`,
        failure: `${base}/reserva/resultado?estado=failure&origen=capsulas`,
        pending: `${base}/reserva/resultado?estado=pending&origen=capsulas`,
      },
      statementDescriptor: "KARUN CAPSULAS",
    });

    await db.collection("capsulas_inscripciones").updateOne(
      { _id: oid, estado: "pending_payment" },
      {
        $set: {
          mpPreferenceId: preferenceId,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({ ok: true, preferenceId, initPoint, externalReference });
  } catch (e) {
    console.error("[capsulas/inscripciones/preferencia]", id, e);
    const message = e instanceof Error ? e.message : "Error al crear preferencia.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
