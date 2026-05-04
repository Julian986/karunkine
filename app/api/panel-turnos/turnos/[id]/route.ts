import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import { getDb } from "../../../../../lib/mongodb";
import { isPanelAuthenticated } from "../../../../../lib/panel-auth";
import {
  reprogramIndividualTurnoByPanel,
  serializeTurnoForCustomer,
} from "../../../../../lib/turnos/customer-turnos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isPanelAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const trimmed = id?.trim() ?? "";
  if (!ObjectId.isValid(trimmed)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const row = await db.collection("turnos").findOne({ _id: new ObjectId(trimmed) });
    if (!row) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
    const base = serializeTurnoForCustomer(row);
    return NextResponse.json({
      ...base,
      horario: String(row.horario ?? ""),
    });
  } catch (e) {
    console.error("[panel-turnos/turnos/[id] GET]", e);
    return NextResponse.json({ error: "No se pudo cargar el turno." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isPanelAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const trimmed = id?.trim() ?? "";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const dateKey =
    typeof body === "object" && body && "dateKey" in body ? String((body as { dateKey: unknown }).dateKey ?? "").trim() : "";
  const timeLocal =
    typeof body === "object" && body && "timeLocal" in body
      ? String((body as { timeLocal: unknown }).timeLocal ?? "").trim()
      : "";

  try {
    const db = await getDb();
    const result = await reprogramIndividualTurnoByPanel(db, trimmed, dateKey, timeLocal);
    if (!result.ok) {
      const code = result.code;
      const status =
        code === "NOT_FOUND"
          ? 404
          : code === "SLOT_UNAVAILABLE" || code === "SLOT_TAKEN" || code === "CONFLICT" || code === "TEMPLATE_MISMATCH"
            ? 409
            : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }
    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[panel-turnos/turnos/[id] PATCH]", e);
    return NextResponse.json({ error: "No se pudo actualizar el turno." }, { status: 500 });
  }
}
