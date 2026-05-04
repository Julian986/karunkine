import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { CACHE_HEADERS_NO_STORE } from "../../../../../lib/http/cache-control";
import { getDb } from "../../../../../lib/mongodb";
import {
  monthAvailabilityIndividual,
  monthAvailabilityIndividualHorario,
} from "../../../../../lib/turnos/disponibilidad-publica";
import { isHorarioIndividualId } from "../../../../../lib/turnos/wanda-schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Disponibilidad mensual para consulta/evaluación (misma grilla). `monthIndex` 0–11. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year"));
  const monthIndex = Number(url.searchParams.get("monthIndex"));
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Año inválido." }, { status: 400, headers: CACHE_HEADERS_NO_STORE });
  }
  if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return NextResponse.json(
      { error: "Mes inválido (monthIndex 0–11)." },
      { status: 400, headers: CACHE_HEADERS_NO_STORE },
    );
  }

  const horario = url.searchParams.get("horario")?.trim() ?? "";
  const excludeRaw = url.searchParams.get("excludeTurnoId")?.trim() ?? "";
  const excludeTurnoId = ObjectId.isValid(excludeRaw) ? new ObjectId(excludeRaw) : undefined;

  try {
    const db = await getDb();
    const availability =
      horario && isHorarioIndividualId(horario)
        ? await monthAvailabilityIndividualHorario(db, year, monthIndex + 1, horario, excludeTurnoId)
        : await monthAvailabilityIndividual(db, year, monthIndex + 1);
    return NextResponse.json({ availability }, { headers: CACHE_HEADERS_NO_STORE });
  } catch (e) {
    console.error("[disponibilidad/mes]", e);
    return NextResponse.json(
      { error: "No se pudo calcular la disponibilidad." },
      { status: 500, headers: CACHE_HEADERS_NO_STORE },
    );
  }
}
