import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/mongodb";

export const runtime = "nodejs";

/**
 * Consulta pública mínima para UX post Checkout (polling). No expone datos personales.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const db = await getDb();
  const row = await db.collection("turnos").findOne(
    { _id: new ObjectId(id) },
    { projection: { estado: 1, modalidad: 1, turnoDetalle: 1, formatoConsulta: 1 } }
  );

  if (!row) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  const modalidad =
    row.modalidad === "consulta_individual" ? "consulta_individual" : "grupal";
  const formato = row.formatoConsulta;
  const formatoConsulta =
    formato === "presencial" || formato === "virtual" ? formato : undefined;

  return NextResponse.json({
    estado: String(row.estado ?? "unknown"),
    modalidad,
    turnoDetalle: String(row.turnoDetalle ?? ""),
    ...(formatoConsulta ? { formatoConsulta } : {}),
  });
}
