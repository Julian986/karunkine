import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "../../../../../../lib/mongodb";

export const runtime = "nodejs";

/** Consulta pública mínima post Checkout (polling). No expone datos personales. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const db = await getDb();
  const row = await db.collection("taller_inscripciones").findOne(
    { _id: new ObjectId(id) },
    { projection: { estado: 1, eventoTitulo: 1, eventoFecha: 1 } },
  );

  if (!row) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    estado: String(row.estado ?? "unknown"),
    eventoTitulo: String(row.eventoTitulo ?? ""),
    eventoFecha: String(row.eventoFecha ?? ""),
  });
}
