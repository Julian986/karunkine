import { NextResponse } from "next/server";

import { getCapsulasCicloBySlug } from "../../../../../lib/capsulas/config";
import { insertarCapsulasInscripcionPendienteDePago } from "../../../../../lib/capsulas/create-pending-inscripcion";
import { resolveCapsulasSeleccionadas } from "../../../../../lib/capsulas/disponibilidad";
import { getDb } from "../../../../../lib/mongodb";
import { ensureCapsulasInscripcionIndexes } from "../../../../../lib/mongodb/ensure-capsulas-indexes";
import { crearCapsulasInscripcionSchema } from "../../../../../lib/validators/capsulas-inscripcion";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const result = crearCapsulasInscripcionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Datos inválidos.", details: result.error.flatten() }, { status: 400 });
  }

  const ciclo = getCapsulasCicloBySlug(result.data.cicloSlug);
  if (!ciclo) {
    return NextResponse.json({ error: "Ciclo no encontrado." }, { status: 404 });
  }

  try {
    const db = await getDb();
    await ensureCapsulasInscripcionIndexes(db);

    const resolved = await resolveCapsulasSeleccionadas(db, ciclo, result.data.capsulaIds);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error, code: resolved.code }, { status: 409 });
    }

    const { insertedId } = await insertarCapsulasInscripcionPendienteDePago(ciclo, result.data, resolved.capsulas);
    return NextResponse.json(
      {
        ok: true,
        id: insertedId.toString(),
        externalReference: insertedId.toString(),
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("[capsulas/inscripciones/pendiente]", e);
    return NextResponse.json({ error: "No se pudo crear la inscripción." }, { status: 500 });
  }
}
