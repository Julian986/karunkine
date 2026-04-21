import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";
import { isPanelAuthenticated } from "../../../../lib/panel-auth";
import {
  deleteWandaAgendaBlockById,
  insertWandaAgendaBlock,
} from "../../../../lib/turnos/wanda-agenda-blocks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ok = await isPanelAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const anchorDateKey = typeof b.anchorDateKey === "string" ? b.anchorDateKey.trim() : "";
  const timeLocal = typeof b.timeLocal === "string" ? b.timeLocal.trim() : "";
  const durationMinutes = Number(b.durationMinutes ?? 60);
  const recurrenceType = typeof b.recurrenceType === "string" ? b.recurrenceType.trim() : "once";
  const untilDateKey =
    typeof b.untilDateKey === "string" && b.untilDateKey.trim() ? b.untilDateKey.trim() : null;
  const notes = b.notes == null ? null : typeof b.notes === "string" ? b.notes : null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchorDateKey) || !/^\d{2}:\d{2}$/.test(timeLocal)) {
    return NextResponse.json({ error: "Fecha u hora inválida." }, { status: 400 });
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes < 15 || durationMinutes > 480) {
    return NextResponse.json({ error: "Duración inválida." }, { status: 400 });
  }

  let recurrence: null | { type: "weekly"; untilDateKey?: string | null } = null;
  if (recurrenceType === "weekly") {
    recurrence = { type: "weekly", untilDateKey: untilDateKey };
  } else if (recurrenceType !== "once") {
    return NextResponse.json({ error: "Tipo de recurrencia inválido." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const result = await insertWandaAgendaBlock(db, {
      anchorDateKey,
      timeLocal,
      durationMinutes,
      recurrence,
      notes,
    });
    return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
  } catch (e) {
    console.error("[panel-turnos/agenda-blocks POST]", e);
    return NextResponse.json({ error: "No se pudo crear el bloqueo." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ok = await isPanelAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const deleted = await deleteWandaAgendaBlockById(db, id);
    if (!deleted) {
      return NextResponse.json({ error: "Bloqueo no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[panel-turnos/agenda-blocks DELETE]", e);
    return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 });
  }
}
