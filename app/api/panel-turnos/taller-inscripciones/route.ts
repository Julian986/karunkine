import { NextResponse } from "next/server";

import { CACHE_HEADERS_NO_STORE } from "../../../../lib/http/cache-control";
import { getDb } from "../../../../lib/mongodb";
import { isPanelAuthenticated } from "../../../../lib/panel-auth";
import type { TallerInscripcionDoc } from "../../../../lib/taller/create-pending-inscripcion";
import {
  computePanelTallerResumen,
  docToPanelTallerInscripcionRow,
  getTallerEventoForPanelBySlug,
  listActiveTallerEventosForPanel,
  panelTallerEventoResumen,
  sortPanelTallerInscripciones,
} from "../../../../lib/taller/panel-taller-inscripciones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isPanelAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: CACHE_HEADERS_NO_STORE });
  }

  const url = new URL(request.url);
  const countsOnly = url.searchParams.get("countsOnly") === "1";
  const slugParam = url.searchParams.get("eventoSlug")?.trim() ?? "";
  const activos = listActiveTallerEventosForPanel();
  const evento = slugParam
    ? getTallerEventoForPanelBySlug(slugParam)
    : activos[0] ?? null;

  if (!evento) {
    return NextResponse.json({ error: "Evento no encontrado." }, { status: 404, headers: CACHE_HEADERS_NO_STORE });
  }

  try {
    const db = await getDb();
    const docs = await db
      .collection<TallerInscripcionDoc>("taller_inscripciones")
      .find({ eventoSlug: evento.slug })
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    const rows = sortPanelTallerInscripciones(docs.map(docToPanelTallerInscripcionRow));
    const resumen = computePanelTallerResumen(rows);
    const eventoInfo = panelTallerEventoResumen(evento);

    if (countsOnly) {
      return NextResponse.json({ evento: eventoInfo, resumen }, { headers: CACHE_HEADERS_NO_STORE });
    }

    return NextResponse.json(
      { evento: eventoInfo, resumen, inscripciones: rows },
      { headers: CACHE_HEADERS_NO_STORE },
    );
  } catch (e) {
    console.error("[panel-turnos/taller-inscripciones]", e);
    return NextResponse.json(
      { error: "No se pudieron cargar las inscripciones." },
      { status: 500, headers: CACHE_HEADERS_NO_STORE },
    );
  }
}
