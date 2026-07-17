import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import { getDb } from "../../../../../../lib/mongodb";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const db = await getDb();
  const row = await db.collection("capsulas_inscripciones").findOne(
    { _id: new ObjectId(id) },
    { projection: { estado: 1, cicloTitulo: 1, cicloMesLabel: 1, capsulas: 1 } },
  );

  if (!row) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    estado: String(row.estado ?? "unknown"),
    cicloTitulo: String(row.cicloTitulo ?? ""),
    cicloMesLabel: String(row.cicloMesLabel ?? ""),
    capsulasCount: Array.isArray(row.capsulas) ? row.capsulas.length : 0,
  });
}
