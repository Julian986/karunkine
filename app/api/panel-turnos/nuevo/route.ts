import { MongoServerError } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureReservaPaymentIndexes } from "../../../../lib/mongodb/ensure-indexes";
import { getDb } from "../../../../lib/mongodb";
import { isPanelAuthenticated } from "../../../../lib/panel-auth";
import { insertarTurnoManualConfirmado } from "../../../../lib/turnos/create-manual";
import { resolveCitasForReserva } from "../../../../lib/turnos/resolve-reserva-citas";
import { grupalBandFree, isGrupalBandaSinCupo, loadOccupiedSlotKeysGlobal } from "../../../../lib/turnos/wanda-occupancy";
import {
  addDaysDateKey,
  expandGrupalCitas,
  isHorarioGrupalId,
  isoDateWeekday,
  type CitaDoc,
  type HorarioGrupalId,
  utcTodayDateKey,
} from "../../../../lib/turnos/wanda-schedule";
import { MOTIVOS_VALIDOS } from "../../../../lib/validators/reserva-turno";

export const runtime = "nodejs";

const slotObj = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeLocal: z.string().regex(/^\d{2}:\d{2}$/),
});

const crearManualSchema = z
  .object({
    nombre: z.string().trim().min(3).max(80),
    mail: z.string().trim().email(),
    celular: z.string().trim().min(8).max(30),
    motivo: z.string().trim().min(1),
    modalidad: z.enum(["grupal", "consulta_individual"]),
    horario: z.string().trim().min(1),
    formatoConsulta: z.enum(["presencial", "virtual"]).optional(),
    horarioEvaluacion: z.string().trim().optional(),
    formatoEvaluacion: z.enum(["presencial", "virtual"]).optional(),
    principalSlot: slotObj.optional(),
    evalSlot: slotObj.optional(),
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
    if (value.modalidad === "grupal") {
      const hasEval =
        Boolean(value.horarioEvaluacion?.trim()) ||
        Boolean(value.formatoEvaluacion) ||
        Boolean(value.evalSlot);
      if (hasEval) {
        if (!value.horarioEvaluacion?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["horarioEvaluacion"],
            message: "Elegí horario de evaluación.",
          });
        }
        if (!value.formatoEvaluacion) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["formatoEvaluacion"],
            message: "Elegí si la evaluación es presencial o virtual.",
          });
        }
        if (!value.evalSlot) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["evalSlot"],
            message: "Elegí día y hora de evaluación.",
          });
        }
      }
    }
  });

const GRUPAL_WEEKS = 26;

async function resolveCitasGrupalSoloClase(
  db: Awaited<ReturnType<typeof getDb>>,
  horarioIdRaw: string,
): Promise<{ ok: true; citas: CitaDoc[] } | { ok: false; error: string; code?: string }> {
  if (!isHorarioGrupalId(horarioIdRaw)) {
    return { ok: false, error: "Horario grupal inválido.", code: "BAD_GRUPAL" };
  }
  const horarioId = horarioIdRaw as HorarioGrupalId;
  if (await isGrupalBandaSinCupo(db, horarioId)) {
    return {
      ok: false,
      error:
        "Esa franja de clases grupales ya completó el cupo máximo de reservas activas. Probá otra franja u horario.",
      code: "GRUPAL_BAND_FULL",
    };
  }
  const occupied = await loadOccupiedSlotKeysGlobal(db);
  const from = utcTodayDateKey();
  for (let i = 0; i <= 730; i++) {
    const dk = addDaysDateKey(from, i);
    const wd = isoDateWeekday(dk);
    if (wd !== 2 && wd !== 4) continue;
    if (!grupalBandFree(occupied, horarioId, dk, GRUPAL_WEEKS)) continue;
    return {
      ok: true,
      citas: expandGrupalCitas({
        horarioId,
        anchorMarOrJueDateKey: dk,
        weeks: GRUPAL_WEEKS,
      }),
    };
  }
  return {
    ok: false,
    error: "No hay semana de inicio disponible para esa franja grupal.",
    code: "GRUPAL_NO_ANCLA",
  };
}

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

  try {
    const db = await getDb();
    await ensureReservaPaymentIndexes(db);

    const hasEvalInGrupal =
      parsed.data.modalidad === "grupal" &&
      Boolean(parsed.data.horarioEvaluacion?.trim()) &&
      Boolean(parsed.data.evalSlot);

    const resolved =
      parsed.data.modalidad === "grupal" && !hasEvalInGrupal
        ? await resolveCitasGrupalSoloClase(db, parsed.data.horario)
        : await resolveCitasForReserva(db, {
            modalidad: parsed.data.modalidad,
            horario: parsed.data.horario,
            principalSlot: parsed.data.principalSlot,
            evalSlot: parsed.data.evalSlot,
            horarioEvaluacion: parsed.data.horarioEvaluacion,
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
      horario: parsed.data.horario,
      formatoConsulta: parsed.data.formatoConsulta,
      horarioEvaluacion: parsed.data.horarioEvaluacion,
      formatoEvaluacion: parsed.data.formatoEvaluacion,
      citas: resolved.citas,
      notaInterna: parsed.data.notaInterna,
    });

    return NextResponse.json({ ok: true, id: insertedId.toHexString() }, { status: 201 });
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
