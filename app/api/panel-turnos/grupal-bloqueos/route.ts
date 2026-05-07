import { NextResponse } from "next/server";

import { getDb } from "../../../../lib/mongodb";
import { isPanelAuthenticated } from "../../../../lib/panel-auth";
import {
  listWandaGrupalBloqueos,
  removeWandaGrupalHorarioBloqueado,
  setWandaGrupalHorarioBloqueado,
} from "../../../../lib/turnos/wanda-grupal-bloqueos";

export const runtime = "nodejs";

export async function GET() {
  const ok = await isPanelAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  try {
    const db = await getDb();
    const rows = await listWandaGrupalBloqueos(db);
    return NextResponse.json({ bloqueos: rows });
  } catch (e) {
    console.error("[panel-turnos/grupal-bloqueos GET]", e);
    return NextResponse.json({ error: "No se pudo cargar." }, { status: 500 });
  }
}

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
  const horarioId = typeof b.horarioId === "string" ? b.horarioId.trim() : "";
  const note = typeof b.note === "string" ? b.note : null;
  if (!horarioId) {
    return NextResponse.json({ error: "Falta horario grupal." }, { status: 400 });
  }
  try {
    const db = await getDb();
    const result = await setWandaGrupalHorarioBloqueado(db, horarioId, note);
    return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "HORARIO_INVALIDO") {
      return NextResponse.json({ error: "Horario grupal inválido." }, { status: 400 });
    }
    console.error("[panel-turnos/grupal-bloqueos POST]", e);
    return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ok = await isPanelAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("horarioId")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "Falta horario grupal." }, { status: 400 });
  }
  try {
    const db = await getDb();
    const deleted = await removeWandaGrupalHorarioBloqueado(db, id);
    if (!deleted) {
      return NextResponse.json({ error: "Bloqueo no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[panel-turnos/grupal-bloqueos DELETE]", e);
    return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 });
  }
}
