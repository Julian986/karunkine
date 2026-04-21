import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/mongodb";
import { monthAvailabilityIndividual } from "../../../../../lib/turnos/disponibilidad-publica";

export const runtime = "nodejs";

/** Disponibilidad mensual para consulta/evaluación (misma grilla). `monthIndex` 0–11. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year"));
  const monthIndex = Number(url.searchParams.get("monthIndex"));
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Año inválido." }, { status: 400 });
  }
  if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return NextResponse.json({ error: "Mes inválido (monthIndex 0–11)." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const availability = await monthAvailabilityIndividual(db, year, monthIndex + 1);
    return NextResponse.json({ availability });
  } catch (e) {
    console.error("[disponibilidad/mes]", e);
    return NextResponse.json({ error: "No se pudo calcular la disponibilidad." }, { status: 500 });
  }
}
