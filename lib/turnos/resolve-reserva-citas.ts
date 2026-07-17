import type { Db } from "mongodb";

import {
  addDaysDateKey,
  eachIndividualOccurrenceFrom,
  expandGrupalCitas,
  isHorarioGrupalId,
  isHorarioIndividualId,
  isoDateWeekday,
  matchIndividualTemplate,
  normalizeTimeLocal,
  slotKey,
  weekdayMatchesGrupalTemplate,
  type CitaDoc,
  type HorarioGrupalId,
  type HorarioIndividualId,
  utcTodayDateKey,
} from "./wanda-schedule";
import {
  assertIndividualSlotMatchesTemplate,
  grupalBandFree,
  isGrupalBandaSinCupo,
  isSlotFreePublic,
  loadOccupiedSlotKeysGlobal,
} from "./wanda-occupancy";

const GRUPAL_WEEKS = 26;
const INDIVIDUAL_SEARCH_WEEKS = 52;

/** Primer día válido (ancla) desde `fromDateKey` donde la banda grupal es libre y no pisa la evaluación. */
export function findFirstGrupalAnchorForEval(
  occupied: Set<string>,
  horG: HorarioGrupalId,
  evalDateKey: string,
  evalTimeLocal: string,
  fromDateKey: string,
): string | null {
  const evalKey = slotKey(evalDateKey, normalizeTimeLocal(evalTimeLocal));
  for (let i = 0; i <= 730; i++) {
    const dk = addDaysDateKey(fromDateKey, i);
    const wd = isoDateWeekday(dk);
    if (wd === null || !weekdayMatchesGrupalTemplate(horG, wd)) continue;
    if (!grupalBandFree(occupied, horG, dk, GRUPAL_WEEKS)) continue;
    const claseCitas = expandGrupalCitas({ horarioId: horG, anchorMarOrJueDateKey: dk, weeks: GRUPAL_WEEKS });
    if (claseCitas.some((c) => slotKey(c.dateKey, normalizeTimeLocal(c.timeLocal)) === evalKey)) continue;
    return dk;
  }
  return null;
}

/** Si ese turno puntual puede ser evaluación de un plan grupal `horG` (libre + existe ancla válida). */
export function evalConcreteFeasibleForGrupal(
  occupied: Set<string>,
  horG: HorarioGrupalId,
  evalDateKey: string,
  evalTimeLocal: string,
): boolean {
  const etl = normalizeTimeLocal(evalTimeLocal);
  if (!isSlotFreePublic(occupied, evalDateKey, etl)) return false;
  const from = utcTodayDateKey();
  return Boolean(findFirstGrupalAnchorForEval(occupied, horG, evalDateKey, etl, from));
}

/** Hay al menos una fecha de evaluación libre (plantilla `hevId`) y una ancla grupal compatible. */
export function hasGrupalEvalCombo(
  occupied: Set<string>,
  horG: HorarioGrupalId,
  hevId: HorarioIndividualId,
  fromDateKey: string,
): boolean {
  for (const o of eachIndividualOccurrenceFrom(hevId, fromDateKey, INDIVIDUAL_SEARCH_WEEKS)) {
    if (!isSlotFreePublic(occupied, o.dateKey, o.timeLocal)) continue;
    const eTl = normalizeTimeLocal(o.timeLocal);
    if (findFirstGrupalAnchorForEval(occupied, horG, o.dateKey, eTl, fromDateKey)) return true;
  }
  return false;
}

export type ReservaCitasPayload = {
  modalidad: "grupal" | "consulta_individual";
  horario: string;
  principalSlot?: { dateKey: string; timeLocal: string };
  grupalClaseAnclaDateKey?: string;
  evalSlot?: { dateKey: string; timeLocal: string };
  /** Código lun_1600… (solo grupal). */
  horarioEvaluacion?: string;
};

export type ResolveCitasResult =
  | {
      ok: true;
      citas: CitaDoc[];
      horarioIndividual: HorarioIndividualId | null;
      horarioEvaluacion: HorarioIndividualId | null;
    }
  | { ok: false; error: string; code?: string };

export async function resolveCitasForReserva(
  db: Db,
  input: ReservaCitasPayload,
): Promise<ResolveCitasResult> {
  const occupied = await loadOccupiedSlotKeysGlobal(db);

  if (input.modalidad === "consulta_individual") {
    let dk: string;
    let tl: string;

    if (input.principalSlot?.dateKey && input.principalSlot?.timeLocal) {
      dk = input.principalSlot.dateKey;
      tl = normalizeTimeLocal(input.principalSlot.timeLocal);
    } else {
      if (!isHorarioIndividualId(input.horario)) {
        return { ok: false, error: "Horario individual inválido.", code: "BAD_HORARIO" };
      }
      const hid0 = input.horario as HorarioIndividualId;
      const from = utcTodayDateKey();
      const occs = eachIndividualOccurrenceFrom(hid0, from, INDIVIDUAL_SEARCH_WEEKS);
      const chosen = occs.find((o) => isSlotFreePublic(occupied, o.dateKey, o.timeLocal));
      if (!chosen) {
        return {
          ok: false,
          error: "No hay turnos libres para ese horario en los próximos meses.",
          code: "FULLY_BOOKED",
        };
      }
      dk = chosen.dateKey;
      tl = normalizeTimeLocal(chosen.timeLocal);
    }

    if (!assertIndividualSlotMatchesTemplate(dk, tl)) {
      return { ok: false, error: "El horario no coincide con la grilla de consultas.", code: "BAD_TEMPLATE" };
    }
    const hid = matchIndividualTemplate(dk, tl);
    if (!hid || hid !== input.horario || !isHorarioIndividualId(input.horario)) {
      return { ok: false, error: "La selección no coincide con el horario elegido.", code: "MISMATCH" };
    }
    if (!isSlotFreePublic(occupied, dk, tl)) {
      return { ok: false, error: "Ese turno ya no está disponible. Elegí otro día u horario.", code: "OCCUPIED" };
    }
    return {
      ok: true,
      citas: [{ dateKey: dk, timeLocal: tl, tipo: "consulta_individual", templateId: hid }],
      horarioIndividual: hid,
      horarioEvaluacion: null,
    };
  }

  if (!isHorarioGrupalId(input.horario)) {
    return { ok: false, error: "Horario grupal inválido.", code: "BAD_GRUPAL" };
  }
  const horG = input.horario as HorarioGrupalId;

  if (await isGrupalBandaSinCupo(db, horG)) {
    return {
      ok: false,
      error:
        "Esa franja de clases grupales ya completó el cupo máximo de reservas activas. Probá otra franja u horario.",
      code: "GRUPAL_BAND_FULL",
    };
  }

  const hev = input.horarioEvaluacion?.trim() ?? "";
  if (!isHorarioIndividualId(hev)) {
    return { ok: false, error: "Horario de evaluación inválido.", code: "BAD_EVAL_CODE" };
  }
  const hevId = hev as HorarioIndividualId;

  const hasExplicitAncla = Boolean(input.grupalClaseAnclaDateKey?.trim());
  const hasExplicitEval = Boolean(input.evalSlot?.dateKey && input.evalSlot?.timeLocal);
  const from = utcTodayDateKey();

  let ancla: string;
  let edk: string;
  let etl: string;

  if (hasExplicitEval && hasExplicitAncla) {
    ancla = input.grupalClaseAnclaDateKey!.trim();
    edk = input.evalSlot!.dateKey;
    etl = normalizeTimeLocal(input.evalSlot!.timeLocal);
    const w = isoDateWeekday(ancla);
    if (w === null || !weekdayMatchesGrupalTemplate(horG, w)) {
      return { ok: false, error: "La primera clase no coincide con la franja elegida.", code: "BAD_ANCLA" };
    }
    if (!grupalBandFree(occupied, horG, ancla, GRUPAL_WEEKS)) {
      return {
        ok: false,
        error: "Hay fechas ocupadas o bloqueadas en esa franja. Elegí otra semana u horario.",
        code: "GRUPAL_OCCUPIED",
      };
    }
  } else if (hasExplicitEval && !hasExplicitAncla) {
    edk = input.evalSlot!.dateKey;
    etl = normalizeTimeLocal(input.evalSlot!.timeLocal);
    const anchor = findFirstGrupalAnchorForEval(occupied, horG, edk, etl, from);
    if (!anchor) {
      return {
        ok: false,
        error: "No hay semana de inicio de clases compatible con esa evaluación.",
        code: "NO_ANCLA_FOR_EVAL",
      };
    }
    ancla = anchor;
  } else if (!hasExplicitEval && hasExplicitAncla) {
    ancla = input.grupalClaseAnclaDateKey!.trim();
    const w = isoDateWeekday(ancla);
    if (w === null || !weekdayMatchesGrupalTemplate(horG, w)) {
      return { ok: false, error: "La primera clase no coincide con la franja elegida.", code: "BAD_ANCLA" };
    }
    if (!grupalBandFree(occupied, horG, ancla, GRUPAL_WEEKS)) {
      return {
        ok: false,
        error: "Hay fechas ocupadas o bloqueadas en esa franja. Elegí otra semana u horario.",
        code: "GRUPAL_OCCUPIED",
      };
    }
    const claseCitasPreview = expandGrupalCitas({ horarioId: horG, anchorMarOrJueDateKey: ancla, weeks: GRUPAL_WEEKS });
    const chosen = eachIndividualOccurrenceFrom(hevId, from, INDIVIDUAL_SEARCH_WEEKS).find((o) => {
      if (!isSlotFreePublic(occupied, o.dateKey, o.timeLocal)) return false;
      const ek = slotKey(o.dateKey, normalizeTimeLocal(o.timeLocal));
      return !claseCitasPreview.some((c) => slotKey(c.dateKey, normalizeTimeLocal(c.timeLocal)) === ek);
    });
    if (!chosen) {
      return {
        ok: false,
        error: "No hay turno de evaluación libre compatible con esa semana de clases.",
        code: "EVAL_NO_SLOT_FOR_ANCLA",
      };
    }
    edk = chosen.dateKey;
    etl = normalizeTimeLocal(chosen.timeLocal);
  } else {
    let found: { edk: string; etl: string; ancla: string } | null = null;
    for (const o of eachIndividualOccurrenceFrom(hevId, from, INDIVIDUAL_SEARCH_WEEKS)) {
      if (!isSlotFreePublic(occupied, o.dateKey, o.timeLocal)) continue;
      const eTl = normalizeTimeLocal(o.timeLocal);
      const anchor = findFirstGrupalAnchorForEval(occupied, horG, o.dateKey, eTl, from);
      if (!anchor) continue;
      found = { edk: o.dateKey, etl: eTl, ancla: anchor };
      break;
    }
    if (!found) {
      return {
        ok: false,
        error: "No hay turno de evaluación libre para ese horario (puede estar ocupado por otra reserva).",
        code: "GRUPAL_EVAL_NO_COMBO",
      };
    }
    edk = found.edk;
    etl = found.etl;
    ancla = found.ancla;
  }

  if (!assertIndividualSlotMatchesTemplate(edk, etl)) {
    return { ok: false, error: "La evaluación no coincide con la grilla disponible.", code: "BAD_EVAL" };
  }
  const eid = matchIndividualTemplate(edk, etl);
  if (!eid || eid !== hev) {
    return { ok: false, error: "La evaluación no coincide con el horario elegido.", code: "EVAL_MISMATCH" };
  }
  if (!isSlotFreePublic(occupied, edk, etl)) {
    return { ok: false, error: "El turno de evaluación ya no está disponible.", code: "EVAL_OCCUPIED" };
  }

  const claseCitas = expandGrupalCitas({ horarioId: horG, anchorMarOrJueDateKey: ancla, weeks: GRUPAL_WEEKS });
  const evalKey = slotKey(edk, etl);
  if (claseCitas.some((c) => slotKey(c.dateKey, normalizeTimeLocal(c.timeLocal)) === evalKey)) {
    return {
      ok: false,
      error: "La evaluación no puede coincidir con un horario de clase grupal.",
      code: "EVAL_OVERLAP_GRUPAL",
    };
  }
  const citas: CitaDoc[] = [
    ...claseCitas,
    { dateKey: edk, timeLocal: etl, tipo: "evaluacion_grupal", templateId: eid },
  ];

  return {
    ok: true,
    citas,
    horarioIndividual: null,
    horarioEvaluacion: eid,
  };
}
