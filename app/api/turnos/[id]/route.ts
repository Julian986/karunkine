import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "../../../../lib/mongodb";
import { isPanelAuthenticated } from "../../../../lib/panel-auth";

const updateSchema = z.object({
  estado: z
    .enum([
      "pending_payment",
      "pendiente",
      "contactado",
      "confirmado",
      "cancelado",
      "expirado",
    ])
    .optional(),
  notaInterna: z.string().max(2000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authenticated = await isPanelAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const updateSet: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  const updateUnset: Record<string, "" | 1> = {};

  if (typeof result.data.estado !== "undefined") {
    updateSet.estado = result.data.estado;
  }

  if (typeof result.data.notaInterna !== "undefined") {
    updateSet.notaInterna = result.data.notaInterna;
  }

  if (result.data.estado === "cancelado") {
    updateSet.canceladoPor = "profesional";
    updateSet.motivoCancelacion = "Cancelado desde el panel de gestión.";
    updateUnset.blockingSlotKeys = "";
  }

  if (result.data.estado === "expirado") {
    updateUnset.blockingSlotKeys = "";
  }

  if (result.data.estado && result.data.estado !== "cancelado") {
    updateUnset.canceladoPor = "";
    updateUnset.motivoCancelacion = "";
  }

  const db = await getDb();
  const updateDoc: {
    $set: Record<string, unknown>;
    $unset?: Record<string, "" | 1>;
  } = { $set: updateSet };
  if (Object.keys(updateUnset).length > 0) {
    updateDoc.$unset = updateUnset;
  }

  const updateResult = await db.collection("turnos").updateOne(
    { _id: new ObjectId(id) },
    updateDoc
  );

  if (updateResult.matchedCount === 0) {
    return NextResponse.json({ error: "Registro no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
