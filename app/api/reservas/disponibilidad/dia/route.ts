import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/mongodb";
import { daySlotsIndividual } from "../../../../../lib/turnos/disponibilidad-publica";

export const runtime = "nodejs";

/** Slots con etiqueta explícita (ej. miércoles 22/04 17:00). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateKey = url.searchParams.get("dateKey")?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const slots = await daySlotsIndividual(db, dateKey);
    return NextResponse.json({ slots });
  } catch (e) {
    console.error("[disponibilidad/dia]", e);
    return NextResponse.json({ error: "No se pudieron cargar los horarios." }, { status: 500 });
  }
}
