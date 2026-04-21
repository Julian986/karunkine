import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/mongodb";
import { daySlotsEvalGrupal } from "../../../../../lib/turnos/disponibilidad-publica";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateKey = url.searchParams.get("dateKey")?.trim() ?? "";
  const horario = url.searchParams.get("horario")?.trim() ?? "";

  if (!horario) {
    return NextResponse.json({ error: "Falta horario grupal." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const slots = await daySlotsEvalGrupal(db, dateKey, horario);
    return NextResponse.json({ slots });
  } catch (e) {
    console.error("[disponibilidad/dia-eval-grupal]", e);
    return NextResponse.json({ error: "No se pudieron cargar los horarios." }, { status: 500 });
  }
}
