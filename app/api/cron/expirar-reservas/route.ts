import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";
import { getCronSecret } from "../../../../lib/mercadopago/env";

export const runtime = "nodejs";

/**
 * Marca como expiradas las reservas pending_payment vencidas (sin pago).
 * Protegé con CRON_SECRET en producción (Authorization: Bearer ...).
 */
export async function GET(request: Request) {
  const secret = getCronSecret();
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
  }

  const db = await getDb();
  const now = new Date();

  const result = await db.collection("turnos").updateMany(
    {
      estado: "pending_payment",
      paymentExpiresAt: { $lt: now },
    },
    {
      $set: {
        estado: "expirado",
        updatedAt: now,
      },
      $unset: { blockingSlotKeys: "" },
    }
  );

  console.info("[cron/expirar-reservas]", {
    matched: result.matchedCount,
    modified: result.modifiedCount,
  });

  return NextResponse.json({
    ok: true,
    matched: result.matchedCount,
    modified: result.modifiedCount,
  });
}
