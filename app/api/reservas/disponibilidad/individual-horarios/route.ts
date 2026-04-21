import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/mongodb";
import { listHorariosIndividualDisponibles } from "../../../../../lib/turnos/disponibilidad-publica";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Códigos de consulta individual con al menos un turno libre en los próximos meses. */
export async function GET() {
  try {
    const db = await getDb();
    const horarios = await listHorariosIndividualDisponibles(db);
    return NextResponse.json({ horarios });
  } catch (e) {
    console.error("[disponibilidad/individual-horarios]", e);
    return NextResponse.json({ error: "No se pudieron cargar los horarios." }, { status: 500 });
  }
}
