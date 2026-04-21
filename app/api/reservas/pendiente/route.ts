import { NextResponse } from "next/server";
import { crearReservaTurnoSchema } from "../../../../lib/validators/reserva-turno";
import { insertarTurnoPendienteDePago } from "../../../../lib/turnos/create-pending";
import { resolveCitasForReserva } from "../../../../lib/turnos/resolve-reserva-citas";
import { ensureReservaPaymentIndexes } from "../../../../lib/mongodb/ensure-indexes";
import { getDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

/**
 * Crea reserva en MongoDB con estado `pending_payment`.
 * El cobro se inicia con POST /api/reservas/[id]/preferencia (Checkout Pro).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const result = crearReservaTurnoSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    await ensureReservaPaymentIndexes(db);

    const resolved = await resolveCitasForReserva(db, {
      modalidad: result.data.modalidad,
      horario: result.data.horario,
      principalSlot: result.data.principalSlot,
      grupalClaseAnclaDateKey: result.data.grupalClaseAnclaDateKey,
      evalSlot: result.data.evalSlot,
      horarioEvaluacion: result.data.horarioEvaluacion,
    });
    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.error, code: resolved.code },
        { status: 409 }
      );
    }

    const { insertedId } = await insertarTurnoPendienteDePago({
      ...result.data,
      citas: resolved.citas,
    });
    return NextResponse.json(
      {
        ok: true,
        id: insertedId.toString(),
        externalReference: insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("[reservas/pendiente]", e);
    return NextResponse.json({ error: "No se pudo crear la reserva." }, { status: 500 });
  }
}
