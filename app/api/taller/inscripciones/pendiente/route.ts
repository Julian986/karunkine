import { NextResponse } from "next/server";
import { insertarInscripcionTallerPendienteDePago } from "../../../../../lib/taller/create-pending-inscripcion";
import { getTallerEventoBySlug } from "../../../../../lib/taller/get-evento";
import { getDb } from "../../../../../lib/mongodb";
import { ensureTallerInscripcionIndexes } from "../../../../../lib/mongodb/ensure-taller-indexes";
import { crearTallerInscripcionSchema } from "../../../../../lib/validators/taller-inscripcion";

export const runtime = "nodejs";

/**
 * Crea inscripción al taller en MongoDB con estado `pending_payment`.
 * El cobro se inicia con POST /api/taller/inscripciones/[id]/preferencia.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const result = crearTallerInscripcionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: result.error.flatten() },
      { status: 400 },
    );
  }

  const evento = getTallerEventoBySlug(result.data.eventoSlug);
  if (!evento) {
    return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
  }

  try {
    const db = await getDb();
    await ensureTallerInscripcionIndexes(db);

    const { insertedId } = await insertarInscripcionTallerPendienteDePago(evento, result.data);
    return NextResponse.json(
      {
        ok: true,
        id: insertedId.toString(),
        externalReference: insertedId.toString(),
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("[taller/inscripciones/pendiente]", e);
    return NextResponse.json({ error: "No se pudo crear la inscripción." }, { status: 500 });
  }
}
