import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/mongodb";
import { listHorariosEvaluacionParaGrupal } from "../../../../../lib/turnos/disponibilidad-publica";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Códigos de horario de evaluación que aún tienen al menos un hueco libre compatible con la banda grupal. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const horario = url.searchParams.get("horario")?.trim() ?? "";

  if (!horario) {
    return NextResponse.json({ error: "Falta horario grupal." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const horarios = await listHorariosEvaluacionParaGrupal(db, horario);
    return NextResponse.json({ horarios });
  } catch (e) {
    console.error("[disponibilidad/grupal-eval-horarios]", e);
    return NextResponse.json({ error: "No se pudieron cargar los horarios." }, { status: 500 });
  }
}
