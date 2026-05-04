import { NextResponse } from "next/server";
import { CACHE_HEADERS_NO_STORE } from "../../../../../lib/http/cache-control";
import { getDb } from "../../../../../lib/mongodb";
import { listGrupalAnclaOpciones } from "../../../../../lib/turnos/disponibilidad-publica";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Primeras anclas mar/jue libres para una banda grupal. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const horario = url.searchParams.get("horario")?.trim() ?? "";
  const weeks = Math.min(24, Math.max(4, Number(url.searchParams.get("weeks") ?? "12")));

  if (!horario) {
    return NextResponse.json({ error: "Falta horario grupal." }, { status: 400, headers: CACHE_HEADERS_NO_STORE });
  }

  try {
    const db = await getDb();
    const opciones = (await listGrupalAnclaOpciones(db, horario, weeks)).slice(0, 24);
    return NextResponse.json({ opciones }, { headers: CACHE_HEADERS_NO_STORE });
  } catch (e) {
    console.error("[disponibilidad/grupal-anclas]", e);
    return NextResponse.json(
      { error: "No se pudieron cargar las opciones." },
      { status: 500, headers: CACHE_HEADERS_NO_STORE },
    );
  }
}
