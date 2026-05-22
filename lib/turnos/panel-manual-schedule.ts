import type { Db } from "mongodb";

import {
  expandRecurringDateKeys,
  type PanelRepeatMode,
  PANEL_HORARIO_LIBRE,
  PANEL_REPEAT_MAX_MONTHLY,
  PANEL_REPEAT_MAX_OCCURRENCES,
  PANEL_REPEAT_MAX_WEEKLY,
} from "./panel-manual-schedule-shared";
import {
  addDaysDateKey,
  expandGrupalCitas,
  isHorarioGrupalId,
  isoDateWeekday,
  normalizeTimeLocal,
  slotKey,
  type CitaDoc,
  type HorarioGrupalId,
  utcTodayDateKey,
} from "./wanda-schedule";
import {
  grupalBandFree,
  isGrupalBandaSinCupo,
  isSlotFreePublic,
  loadOccupiedSlotKeysGlobal,
} from "./wanda-occupancy";

export {
  expandRecurringDateKeys,
  expandMonthlyDateKeys,
  expandWeeklyDateKeys,
  PANEL_HORARIO_LIBRE,
  PANEL_REPEAT_MAX_MONTHLY,
  PANEL_REPEAT_MAX_OCCURRENCES,
  PANEL_REPEAT_MAX_WEEKLY,
} from "./panel-manual-schedule-shared";
export type { PanelRepeatMode } from "./panel-manual-schedule-shared";

const GRUPAL_WEEKS = 26;

export type PanelManualResolveInput = {
  modalidad: "grupal" | "consulta_individual";
  horarioGrupal: string;
  principalSlot?: { dateKey: string; timeLocal: string };
  evalSlot?: { dateKey: string; timeLocal: string };
  repeatMode?: PanelRepeatMode | null;
  /** Compatibilidad con clientes que envían solo el flag semanal. */
  repeatWeekly?: boolean;
  repeatUntilDateKey?: string | null;
  soloClaseGrupal?: boolean;
};

export type PanelManualResolveResult =
  | {
      ok: true;
      citas: CitaDoc[];
      horario: string;
      horarioEvaluacion?: string;
      fechasOmitidas: string[];
      /** Franja mar/jue asignada automáticamente (evaluación libre). */
      franjaGrupalAsignada?: HorarioGrupalId;
    }
  | { ok: false; error: string; code?: string };

function validateTimeLocal(timeLocal: string): string | null {
  const tl = normalizeTimeLocal(timeLocal);
  if (!/^\d{2}:\d{2}$/.test(tl)) return null;
  const [h, m] = tl.split(":").map(Number);
  if (h < 7 || h > 21 || (h === 21 && m > 0)) return null;
  return tl;
}

async function resolveGrupalSoloClase(
  db: Db,
  horarioIdRaw: string,
): Promise<PanelManualResolveResult> {
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
      horario: horarioId,
      fechasOmitidas: [],
    };
  }
  return {
    ok: false,
    error: "No hay semana de inicio disponible para esa franja grupal.",
    code: "GRUPAL_NO_ANCLA",
  };
}

export async function resolvePanelManualCitas(
  db: Db,
  input: PanelManualResolveInput,
): Promise<PanelManualResolveResult> {
  if (input.modalidad === "grupal" && input.soloClaseGrupal) {
    return resolveGrupalSoloClase(db, input.horarioGrupal);
  }

  const occupied = await loadOccupiedSlotKeysGlobal(db);
  const repeatMode: PanelRepeatMode | null =
    input.repeatMode ?? (input.repeatWeekly ? "weekly" : null);
  const repeatUntilDateKey = input.repeatUntilDateKey ?? null;

  if (input.modalidad === "consulta_individual") {
    if (!input.principalSlot) {
      return { ok: false, error: "Elegí día y hora de consulta.", code: "NO_SLOT" };
    }
    const tl = validateTimeLocal(input.principalSlot.timeLocal);
    if (!tl) {
      return { ok: false, error: "Hora inválida (entre 07:00 y 21:00).", code: "BAD_TIME" };
    }

    const dates = expandRecurringDateKeys({
      anchorDateKey: input.principalSlot.dateKey,
      repeatMode,
      repeatUntilDateKey,
    });
    if (dates.length === 0) {
      return { ok: false, error: "No hay fechas en el rango elegido.", code: "NO_DATES" };
    }

    const citas: CitaDoc[] = [];
    const fechasOmitidas: string[] = [];
    for (const dk of dates) {
      if (!isSlotFreePublic(occupied, dk, tl)) {
        fechasOmitidas.push(dk);
        continue;
      }
      citas.push({
        dateKey: dk,
        timeLocal: tl,
        tipo: "consulta_individual",
        templateId: PANEL_HORARIO_LIBRE,
      });
      occupied.add(slotKey(dk, tl));
    }

    if (citas.length === 0) {
      return {
        ok: false,
        error: "Ninguna fecha quedó libre (ocupadas o bloqueadas).",
        code: "ALL_OCCUPIED",
      };
    }

    return { ok: true, citas, horario: PANEL_HORARIO_LIBRE, fechasOmitidas };
  }

  if (!input.evalSlot) {
    return { ok: false, error: "Elegí día y hora de evaluación.", code: "NO_EVAL" };
  }

  const etl = validateTimeLocal(input.evalSlot.timeLocal);
  if (!etl) {
    return { ok: false, error: "Hora de evaluación inválida (entre 07:00 y 21:00).", code: "BAD_TIME" };
  }

  const evalDates = expandRecurringDateKeys({
    anchorDateKey: input.evalSlot.dateKey,
    repeatMode,
    repeatUntilDateKey,
  });
  if (evalDates.length === 0) {
    return { ok: false, error: "No hay fechas de evaluación en el rango elegido.", code: "NO_DATES" };
  }

  const evalCitas: CitaDoc[] = [];
  const fechasOmitidas: string[] = [];

  /** Panel + evaluación: solo las fechas elegidas/repetidas; el ciclo mar/jue va solo con "Solo ciclo de clases". */
  for (const edk of evalDates) {
    if (!isSlotFreePublic(occupied, edk, etl)) {
      fechasOmitidas.push(edk);
      continue;
    }
    evalCitas.push({
      dateKey: edk,
      timeLocal: etl,
      tipo: "evaluacion_grupal",
      templateId: PANEL_HORARIO_LIBRE,
    });
    occupied.add(slotKey(edk, etl));
  }

  if (evalCitas.length === 0) {
    return {
      ok: false,
      error: "Ninguna evaluación quedó libre (ocupadas o bloqueadas).",
      code: "ALL_EVAL_OCCUPIED",
    };
  }

  return {
    ok: true,
    citas: evalCitas,
    horario: PANEL_HORARIO_LIBRE,
    horarioEvaluacion: PANEL_HORARIO_LIBRE,
    fechasOmitidas,
  };
}
