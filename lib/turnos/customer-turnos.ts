import type { Db, Document } from "mongodb";
import { MongoServerError, ObjectId } from "mongodb";

import { canonicalPhoneDigitsAR, customerPhoneDigitsQueryValues } from "../customer/phone-canonical-ar";
import {
  blockingSlotKeysFromCitas,
  formatDisplayFechaHora,
  formatDisplaySoloFecha,
  formatDisplaySoloHora,
  isHorarioIndividualId,
  matchIndividualTemplate,
  normalizeTimeLocal,
  type CitaDoc,
  type HorarioIndividualId,
} from "./wanda-schedule";
import { buildTurnoDetalleFromCitas } from "./turno-detalle-copy";
import {
  assertIndividualSlotMatchesTemplate,
  isSlotFreePublic,
  loadOccupiedSlotKeysGlobalExcludingTurno,
} from "./wanda-occupancy";
import type { CustomerTurnoPublic } from "./customer-turnos-public";

export type { CustomerTurnoPublic };

const CANCELLABLE = new Set([
  "pending_payment",
  "pendiente",
  "contactado",
  "confirmado",
]);

const REPROGRAM_INDIVIDUAL = new Set(["pending_payment", "pendiente", "contactado", "confirmado"]);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchesCustomerPhone(
  turno: { celular?: string; celularDigits?: string },
  sessionDigits: string,
): boolean {
  const keys = new Set(customerPhoneDigitsQueryValues(sessionDigits));
  const stored = turno.celularDigits ? String(turno.celularDigits).trim() : "";
  if (stored && keys.has(stored)) return true;
  const fromCelular = canonicalPhoneDigitsAR(String(turno.celular ?? ""));
  return Boolean(fromCelular && keys.has(fromCelular));
}

export function buildTurnoListFilter(sessionDigits: string): Document {
  const keys = customerPhoneDigitsQueryValues(sessionDigits);
  const last10 =
    sessionDigits.length >= 10 ? sessionDigits.replace(/\D/g, "").slice(-10) : sessionDigits;
  const or: Document[] = [{ celularDigits: { $in: keys } }];
  if (last10.length >= 8) {
    or.push({
      celularDigits: { $exists: false },
      celular: { $regex: escapeRegex(last10), $options: "i" },
    });
  }
  return { $or: or };
}

function firstSortableCita(citas: CitaDoc[] | undefined): { dateKey: string; timeLocal: string; label: string } | null {
  if (!Array.isArray(citas) || citas.length === 0) return null;
  const sorted = [...citas].sort((a, b) => {
    const c = a.dateKey.localeCompare(b.dateKey);
    return c !== 0 ? c : normalizeTimeLocal(a.timeLocal).localeCompare(normalizeTimeLocal(b.timeLocal));
  });
  const c = sorted[0];
  if (!c?.dateKey || !c?.timeLocal) return null;
  return {
    dateKey: String(c.dateKey).trim(),
    timeLocal: normalizeTimeLocal(String(c.timeLocal)),
    label: formatDisplayFechaHora(String(c.dateKey).trim(), String(c.timeLocal)),
  };
}

export function serializeTurnoForCustomer(row: Document): CustomerTurnoPublic {
  const id = (row._id as ObjectId).toHexString();
  const estado = String(row.estado ?? "");
  const modalidad = row.modalidad === "consulta_individual" ? "consulta_individual" : "grupal";
  const citas = row.citas as CitaDoc[] | undefined;
  const first = firstSortableCita(citas);
  const displayStartsAt = first ? `${first.dateKey}T${first.timeLocal}:00` : String(row.createdAt ?? "");
  const canCancel = CANCELLABLE.has(estado);
  const horario = String(row.horario ?? "");
  const canRescheduleIndividual =
    modalidad === "consulta_individual" &&
    REPROGRAM_INDIVIDUAL.has(estado) &&
    isHorarioIndividualId(horario) &&
    Array.isArray(citas) &&
    citas.some((c) => c.tipo === "consulta_individual");

  return {
    id,
    estado,
    modalidad,
    turnoDetalle: String(row.turnoDetalle ?? ""),
    displayStartsAt,
    primeraCitaLabel: first?.label ?? "—",
    displayFechaLine: first ? formatDisplaySoloFecha(first.dateKey) : "—",
    displayHoraLine: first ? formatDisplaySoloHora(first.timeLocal) : "—",
    canCancel,
    canRescheduleIndividual,
    formatoConsulta:
      row.formatoConsulta === "presencial" || row.formatoConsulta === "virtual"
        ? row.formatoConsulta
        : undefined,
  };
}

export async function listCustomerTurnos(db: Db, sessionDigits: string): Promise<Document[]> {
  const filter = buildTurnoListFilter(sessionDigits);
  return db
    .collection("turnos")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(80)
    .toArray();
}

export async function findCustomerTurnoById(
  db: Db,
  turnoIdHex: string,
  sessionDigits: string,
): Promise<Document | null> {
  if (!ObjectId.isValid(turnoIdHex)) return null;
  const row = await db.collection("turnos").findOne({ _id: new ObjectId(turnoIdHex) });
  if (!row) return null;
  if (!matchesCustomerPhone(row as { celular?: string; celularDigits?: string }, sessionDigits)) return null;
  return row;
}

export type CancelResult = { ok: true } | { ok: false; error: string; code: string };

export async function cancelTurnoByCustomer(
  db: Db,
  turnoIdHex: string,
  sessionDigits: string,
): Promise<CancelResult> {
  const row = await findCustomerTurnoById(db, turnoIdHex, sessionDigits);
  if (!row) return { ok: false, error: "No encontramos ese turno.", code: "NOT_FOUND" };
  const estado = String(row.estado ?? "");
  if (!CANCELLABLE.has(estado)) {
    return { ok: false, error: "Este turno no se puede cancelar desde acá.", code: "NOT_CANCELLABLE" };
  }
  const now = new Date();
  const r = await db.collection("turnos").updateOne(
    { _id: row._id as ObjectId, estado: estado as never },
    {
      $set: {
        estado: "cancelado",
        canceladoPor: "paciente",
        motivoCancelacion: "Cancelado por la persona desde la web.",
        updatedAt: now,
      },
      $unset: { blockingSlotKeys: "" },
    },
  );
  if (r.matchedCount === 0) {
    return { ok: false, error: "El estado del turno cambió. Actualizá la página.", code: "CONFLICT" };
  }
  return { ok: true };
}

export type ReprogramResult = { ok: true } | { ok: false; error: string; code: string };

async function reprogramIndividualTurnoCore(
  db: Db,
  row: Document,
  newDateKey: string,
  newTimeLocal: string,
): Promise<ReprogramResult> {
  const estado = String(row.estado ?? "");
  if (!REPROGRAM_INDIVIDUAL.has(estado)) {
    return { ok: false, error: "Este turno no se puede reprogramar desde acá.", code: "NOT_MOVABLE" };
  }

  if (row.modalidad !== "consulta_individual") {
    return { ok: false, error: "La reprogramación online es solo para consulta individual.", code: "NOT_MOVABLE" };
  }

  const horario = String(row.horario ?? "");
  if (!isHorarioIndividualId(horario)) {
    return { ok: false, error: "Horario no reconocido.", code: "NOT_MOVABLE" };
  }

  const dk = newDateKey.trim();
  const tl = normalizeTimeLocal(newTimeLocal.trim());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dk) || !/^\d{2}:\d{2}$/.test(tl)) {
    return { ok: false, error: "Fecha u hora inválida.", code: "INVALID_SLOT" };
  }

  if (!assertIndividualSlotMatchesTemplate(dk, tl)) {
    return { ok: false, error: "Ese horario no está en la grilla de consultas.", code: "INVALID_SLOT" };
  }

  const matched = matchIndividualTemplate(dk, tl);
  if (matched !== horario) {
    return {
      ok: false,
      error: "Elegí un horario del mismo tipo que tu reserva (mismo día y franja de la consulta).",
      code: "TEMPLATE_MISMATCH",
    };
  }

  const turnoOid = row._id as ObjectId;
  const occupied = await loadOccupiedSlotKeysGlobalExcludingTurno(db, turnoOid);
  if (!isSlotFreePublic(occupied, dk, tl)) {
    return { ok: false, error: "Ese horario ya no está disponible.", code: "SLOT_UNAVAILABLE" };
  }

  const newCitas: CitaDoc[] = [
    {
      dateKey: dk,
      timeLocal: tl,
      tipo: "consulta_individual",
      templateId: horario as HorarioIndividualId,
    },
  ];

  const formatoConsulta =
    row.formatoConsulta === "presencial" || row.formatoConsulta === "virtual" ? row.formatoConsulta : undefined;

  const turnoDetalle = buildTurnoDetalleFromCitas({
    citas: newCitas,
    modalidad: "consulta_individual",
    formatoConsulta,
  });

  const blockingSlotKeys = blockingSlotKeysFromCitas(newCitas);
  const now = new Date();

  try {
    const ur = await db.collection("turnos").updateOne(
      { _id: turnoOid, estado: estado as never },
      {
        $set: {
          citas: newCitas,
          blockingSlotKeys,
          turnoDetalle,
          updatedAt: now,
        },
      },
    );
    if (ur.matchedCount === 0) {
      return { ok: false, error: "El estado del turno cambió. Actualizá la página.", code: "CONFLICT" };
    }
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      return { ok: false, error: "Ese horario acaba de ocuparse. Probá con otro.", code: "SLOT_TAKEN" };
    }
    throw e;
  }

  return { ok: true };
}

export async function reprogramIndividualTurnoByCustomer(
  db: Db,
  turnoIdHex: string,
  sessionDigits: string,
  newDateKey: string,
  newTimeLocal: string,
): Promise<ReprogramResult> {
  const row = await findCustomerTurnoById(db, turnoIdHex, sessionDigits);
  if (!row) return { ok: false, error: "No encontramos ese turno.", code: "NOT_FOUND" };
  return reprogramIndividualTurnoCore(db, row, newDateKey, newTimeLocal);
}

/** Misma lógica que el cliente: el panel puede mover consultas individuales sin cookie de teléfono. */
export async function reprogramIndividualTurnoByPanel(
  db: Db,
  turnoIdHex: string,
  newDateKey: string,
  newTimeLocal: string,
): Promise<ReprogramResult> {
  if (!ObjectId.isValid(turnoIdHex)) {
    return { ok: false, error: "ID inválido.", code: "NOT_FOUND" };
  }
  const row = await db.collection("turnos").findOne({ _id: new ObjectId(turnoIdHex) });
  if (!row) return { ok: false, error: "No encontramos ese turno.", code: "NOT_FOUND" };
  return reprogramIndividualTurnoCore(db, row, newDateKey, newTimeLocal);
}
