import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { CACHE_HEADERS_NO_STORE } from "../../../../../lib/http/cache-control";
import { getDb } from "../../../../../lib/mongodb";
import {
  daySlotsIndividual,
  daySlotsIndividualHorario,
} from "../../../../../lib/turnos/disponibilidad-publica";
import { isHorarioIndividualId } from "../../../../../lib/turnos/wanda-schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Slots con etiqueta explícita (ej. miércoles 22/04 17:00). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateKey = url.searchParams.get("dateKey")?.trim() ?? "";
  const horario = url.searchParams.get("horario")?.trim() ?? "";
  const excludeRaw = url.searchParams.get("excludeTurnoId")?.trim() ?? "";
  const excludeTurnoId = ObjectId.isValid(excludeRaw) ? new ObjectId(excludeRaw) : undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400, headers: CACHE_HEADERS_NO_STORE });
  }

  try {
    const db = await getDb();
    const slots =
      horario && isHorarioIndividualId(horario)
        ? await daySlotsIndividualHorario(db, dateKey, horario, excludeTurnoId)
        : await daySlotsIndividual(db, dateKey, excludeTurnoId);
    return NextResponse.json({ slots }, { headers: CACHE_HEADERS_NO_STORE });
  } catch (e) {
    console.error("[disponibilidad/dia]", e);
    return NextResponse.json(
      { error: "No se pudieron cargar los horarios." },
      { status: 500, headers: CACHE_HEADERS_NO_STORE },
    );
  }
}
