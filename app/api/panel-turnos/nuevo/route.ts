import { MongoServerError } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureReservaPaymentIndexes } from "../../../../lib/mongodb/ensure-indexes";
import { getDb } from "../../../../lib/mongodb";
import { isPanelAuthenticated } from "../../../../lib/panel-auth";
import { insertarTurnoManualConfirmado } from "../../../../lib/turnos/create-manual";
import { resolvePanelManualCitas } from "../../../../lib/turnos/panel-manual-schedule";
import { isHorarioGrupalId } from "../../../../lib/turnos/wanda-schedule";
import { MOTIVOS_VALIDOS } from "../../../../lib/validators/reserva-turno";

export const runtime = "nodejs";

const slotObj = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeLocal: z.string().regex(/^\d{2}:\d{2}$/),
});

const crearManualSchema = z
  .object({
    nombre: z.string().trim().min(3).max(80),
    mail: z.union([z.literal(""), z.string().trim().email()]),
    celular: z.union([z.literal(""), z.string().trim().min(8).max(30)]),
    motivo: z.string().trim().min(1),
    modalidad: z.enum(["grupal", "consulta_individual"]),
    horario: z.string().trim(),
    formatoConsulta: z.enum(["presencial", "virtual"]).optional(),
    formatoEvaluacion: z.enum(["presencial", "virtual"]).optional(),
    principalSlot: slotObj.optional(),
    evalSlot: slotObj.optional(),
    repeatMode: z.enum(["weekly", "monthly"]).optional(),
    repeatWeekly: z.boolean().optional(),
    repeatUntilDateKey: z
      .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
      .optional()
      .nullable(),
    notaInterna: z.string().trim().max(2000).optional(),
  })
  .superRefine((value, ctx) => {
    if (!MOTIVOS_VALIDOS.has(value.motivo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["motivo"],
        message: "Motivo inválido.",
      });
    }
    if (value.modalidad === "consulta_individual" && !value.formatoConsulta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["formatoConsulta"],
        message: "Elegí si la consulta es presencial o virtual.",
      });
    }
    if (value.modalidad === "consulta_individual" && !value.principalSlot) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["principalSlot"],
        message: "Elegí día y hora de consulta.",
      });
    }
    if (value.modalidad === "consulta_individual" && !value.horario.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horario"],
        message: "Horario inválido.",
      });
    }
    if (value.modalidad === "grupal") {
      const tieneEval = Boolean(value.evalSlot);
      if (tieneEval) {
        if (!value.formatoEvaluacion) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["formatoEvaluacion"],
            message: "Elegí si la evaluación es presencial o virtual.",
          });
        }
      } else if (!isHorarioGrupalId(value.horario)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["horario"],
          message: "Elegí una franja de clases mar/jue.",
        });
      }
    }
    const until = value.repeatUntilDateKey?.trim();
    const repite = Boolean(value.repeatMode || value.repeatWeekly);
    if (repite && until && value.principalSlot && until < value.principalSlot.dateKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["repeatUntilDateKey"],
        message: "La fecha de fin debe ser posterior al primer turno.",
      });
    }
    if (repite && until && value.evalSlot && until < value.evalSlot.dateKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["repeatUntilDateKey"],
        message: "La fecha de fin debe ser posterior a la primera evaluación.",
      });
    }
  });

export async function POST(request: Request) {
  if (!(await isPanelAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = crearManualSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const repeatUntilRaw = parsed.data.repeatUntilDateKey?.trim();
  const repeatUntilDateKey = repeatUntilRaw ? repeatUntilRaw : null;

  try {
    const db = await getDb();
    await ensureReservaPaymentIndexes(db);

    const soloClaseGrupal =
      parsed.data.modalidad === "grupal" && !parsed.data.evalSlot;

    const resolved = await resolvePanelManualCitas(db, {
      modalidad: parsed.data.modalidad,
      horarioGrupal: parsed.data.horario,
      principalSlot: parsed.data.principalSlot,
      evalSlot: parsed.data.evalSlot,
      repeatMode: parsed.data.repeatMode ?? (parsed.data.repeatWeekly ? "weekly" : null),
      repeatUntilDateKey,
      soloClaseGrupal,
    });

    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error, code: resolved.code }, { status: 409 });
    }

    const { insertedId } = await insertarTurnoManualConfirmado(db, {
      nombre: parsed.data.nombre,
      mail: parsed.data.mail,
      celular: parsed.data.celular,
      motivo: parsed.data.motivo,
      modalidad: parsed.data.modalidad,
      horario: resolved.horario,
      formatoConsulta: parsed.data.formatoConsulta,
      horarioEvaluacion: resolved.horarioEvaluacion,
      formatoEvaluacion: parsed.data.formatoEvaluacion,
      citas: resolved.citas,
      notaInterna: parsed.data.notaInterna,
    });

    return NextResponse.json(
      {
        ok: true,
        id: insertedId.toHexString(),
        citasCreadas: resolved.citas.filter((c) => c.tipo !== "clase_grupal").length,
        fechasOmitidas: resolved.fechasOmitidas,
      },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      return NextResponse.json(
        { error: "Ese horario acaba de ocuparse. Elegí otro horario.", code: "SLOT_TAKEN" },
        { status: 409 },
      );
    }
    console.error("[panel-turnos/nuevo POST]", e);
    return NextResponse.json({ error: "No se pudo crear el turno manual." }, { status: 500 });
  }
}
