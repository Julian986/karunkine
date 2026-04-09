import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";
import { isPanelAuthenticated } from "../../../lib/panel-auth";

/**
 * Creación de reservas: usar POST /api/reservas/pendiente (Checkout Pro + webhook).
 * Este POST quedó deshabilitado para evitar confirmaciones sin pago.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Este endpoint está deshabilitado.",
      usar: "POST /api/reservas/pendiente seguido de POST /api/reservas/:id/preferencia",
    },
    { status: 410 }
  );
}

export async function GET() {
  const authenticated = await isPanelAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const db = await getDb();
  const rows = await db
    .collection("turnos")
    .find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  const estadosPanel = new Set([
    "pending_payment",
    "pendiente",
    "contactado",
    "confirmado",
    "cancelado",
    "expirado",
  ]);

  const data = rows.map((row) => {
    const rawEstado = String(row.estado ?? "pendiente");
    const estado = estadosPanel.has(rawEstado) ? rawEstado : "pendiente";
    return {
      id: (row._id as ObjectId).toString(),
      createdAt:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString(),
      nombre: String(row.nombre ?? ""),
      mail: String(row.mail ?? ""),
      celular: String(row.celular ?? ""),
      motivo: String(row.motivo ?? ""),
      modalidad:
        row.modalidad === "consulta_individual" ? "consulta_individual" : "grupal",
      turnoDetalle: String(row.turnoDetalle ?? ""),
      precioReferenciaArs: Number(row.precioReferenciaArs ?? 0),
      estado,
      notaInterna: String(row.notaInterna ?? ""),
      canceladoPor:
        row.canceladoPor === "profesional" || row.canceladoPor === "paciente"
          ? row.canceladoPor
          : undefined,
      motivoCancelacion:
        typeof row.motivoCancelacion === "string" ? row.motivoCancelacion : undefined,
    };
  });

  return NextResponse.json({ data });
}
