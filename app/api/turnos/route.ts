import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "../../../lib/mongodb";
import { isPanelAuthenticated } from "../../../lib/panel-auth";

const motivosValidos = new Set([
  "suelo_pelvico",
  "embarazo",
  "posparto",
  "lesion",
  "dolor",
  "postura",
]);

const horariosGrupal = new Set([
  "grupal_930",
  "grupal_1030",
  "grupal_16",
  "grupal_17",
]);

const horariosIndividual = new Set(["mie_930", "mie_1030", "mie_16", "mie_17"]);

const createTurnoSchema = z
  .object({
    nombre: z.string().trim().min(3).max(80),
    mail: z.string().trim().email(),
    celular: z.string().trim().min(8).max(30),
    motivo: z.string().trim().min(1),
    modalidad: z.enum(["grupal", "consulta_individual"]),
    horario: z.string().trim().min(1),
    turnoDetalle: z.string().trim().min(1),
    turnoCodigo: z.string().trim().min(1),
    precioReferenciaArs: z.number().int().positive(),
  })
  .superRefine((value, ctx) => {
    if (!motivosValidos.has(value.motivo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["motivo"],
        message: "Motivo inválido.",
      });
    }
    if (value.modalidad === "grupal" && !horariosGrupal.has(value.horario)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horario"],
        message: "Horario grupal inválido.",
      });
    }
    if (
      value.modalidad === "consulta_individual" &&
      !horariosIndividual.has(value.horario)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horario"],
        message: "Horario individual inválido.",
      });
    }
  });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const result = createTurnoSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const db = await getDb();
  const now = new Date();
  const doc = {
    nombre: result.data.nombre,
    mail: result.data.mail,
    celular: result.data.celular,
    motivo: result.data.motivo,
    modalidad: result.data.modalidad,
    horario: result.data.horario,
    turnoDetalle: result.data.turnoDetalle,
    turnoCodigo: result.data.turnoCodigo,
    precioReferenciaArs: result.data.precioReferenciaArs,
    estado: "pendiente" as const,
    notaInterna: "",
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await db.collection("turnos").insertOne(doc);

  return NextResponse.json(
    {
      ok: true,
      id: insertResult.insertedId.toString(),
    },
    { status: 201 }
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

  const data = rows.map((row) => ({
    id: (row._id as ObjectId).toString(),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString(),
    nombre: String(row.nombre ?? ""),
    mail: String(row.mail ?? ""),
    celular: String(row.celular ?? ""),
    motivo: String(row.motivo ?? ""),
    modalidad:
      row.modalidad === "consulta_individual" ? "consulta_individual" : "grupal",
    turnoDetalle: String(row.turnoDetalle ?? ""),
    precioReferenciaArs: Number(row.precioReferenciaArs ?? 0),
    estado:
      row.estado === "contactado" ||
      row.estado === "confirmado" ||
      row.estado === "cancelado"
        ? row.estado
        : "pendiente",
    notaInterna: String(row.notaInterna ?? ""),
    canceladoPor:
      row.canceladoPor === "profesional" || row.canceladoPor === "paciente"
        ? row.canceladoPor
        : undefined,
    motivoCancelacion:
      typeof row.motivoCancelacion === "string" ? row.motivoCancelacion : undefined,
  }));

  return NextResponse.json({ data });
}
