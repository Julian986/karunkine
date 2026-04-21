import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/mongodb";
import { monthAvailabilityGrupalEval } from "../../../../../lib/turnos/disponibilidad-publica";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Disponibilidad mensual de días donde hay hueco de evaluación compatible con la banda grupal. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year"));
  const monthIndex = Number(url.searchParams.get("monthIndex"));
  const horario = url.searchParams.get("horario")?.trim() ?? "";

  if (!horario) {
    return NextResponse.json({ error: "Falta horario grupal." }, { status: 400 });
  }
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Año inválido." }, { status: 400 });
  }
  if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return NextResponse.json({ error: "Mes inválido (monthIndex 0–11)." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const availability = await monthAvailabilityGrupalEval(db, year, monthIndex + 1, horario);
    return NextResponse.json({ availability });
  } catch (e) {
    console.error("[disponibilidad/mes-eval-grupal]", e);
    return NextResponse.json({ error: "No se pudo calcular la disponibilidad." }, { status: 500 });
  }
}
