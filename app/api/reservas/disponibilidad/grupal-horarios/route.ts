import { NextResponse } from "next/server";
import { CACHE_HEADERS_NO_STORE } from "../../../../../lib/http/cache-control";
import { getDb } from "../../../../../lib/mongodb";
import { listHorariosGrupalDisponibles } from "../../../../../lib/turnos/disponibilidad-publica";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Códigos grupales que hoy siguen disponibles para reservar. */
export async function GET() {
  try {
    const db = await getDb();
    const horarios = await listHorariosGrupalDisponibles(db);
    return NextResponse.json({ horarios }, { headers: CACHE_HEADERS_NO_STORE });
  } catch (e) {
    console.error("[disponibilidad/grupal-horarios]", e);
    return NextResponse.json(
      { error: "No se pudieron cargar los horarios grupales." },
      { status: 500, headers: CACHE_HEADERS_NO_STORE },
    );
  }
}
