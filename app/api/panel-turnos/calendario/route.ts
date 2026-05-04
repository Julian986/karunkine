import { NextResponse } from "next/server";
import { CACHE_HEADERS_NO_STORE } from "../../../../lib/http/cache-control";
import { getDb } from "../../../../lib/mongodb";
import { isPanelAuthenticated } from "../../../../lib/panel-auth";
import { expandTurnoToPanelEventos, eventoInMonth } from "../../../../lib/turnos/panel-events";
import { listWandaAgendaBlocksForMonth, blockToPanelShape } from "../../../../lib/turnos/wanda-agenda-blocks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ok = await isPanelAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: CACHE_HEADERS_NO_STORE });
  }

  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year"));
  const month = Number(url.searchParams.get("month"));
  if (!Number.isFinite(year) || year < 2000 || year > 2100 || !Number.isFinite(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Año o mes inválido." }, { status: 400, headers: CACHE_HEADERS_NO_STORE });
  }

  try {
    const db = await getDb();
    const rows = await db
      .collection("turnos")
      .find({})
      .sort({ createdAt: -1 })
      .limit(800)
      .toArray();

    const eventos = rows.flatMap((row) =>
      expandTurnoToPanelEventos(row as Parameters<typeof expandTurnoToPanelEventos>[0]),
    ).filter((e) => eventoInMonth(e, year, month));

    const blocks = await listWandaAgendaBlocksForMonth(db, year, month);
    const agendaBlocks = blocks.map(blockToPanelShape);

    return NextResponse.json({ eventos, agendaBlocks }, { headers: CACHE_HEADERS_NO_STORE });
  } catch (e) {
    console.error("[panel-turnos/calendario]", e);
    return NextResponse.json(
      { error: "No se pudo cargar el calendario." },
      { status: 500, headers: CACHE_HEADERS_NO_STORE },
    );
  }
}
