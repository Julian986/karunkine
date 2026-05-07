import { ObjectId } from "mongodb";
import type { Db } from "mongodb";

import { canonicalPhoneDigitsAR } from "../customer/phone-canonical-ar";
import { blockingSlotKeysFromCitas, type CitaDoc } from "./wanda-schedule";
import { buildTurnoDetalleFromCitas } from "./turno-detalle-copy";

type InsertTurnoManualInput = {
  nombre: string;
  mail: string;
  celular: string;
  motivo: string;
  modalidad: "grupal" | "consulta_individual";
  horario: string;
  formatoConsulta?: "presencial" | "virtual";
  horarioEvaluacion?: string;
  formatoEvaluacion?: "presencial" | "virtual";
  citas: CitaDoc[];
  notaInterna?: string;
};

const PRECIO_GRUPAL_MENSUAL = 160_000;
const PRECIO_CONSULTA_INDIVIDUAL = 40_000;

export async function insertarTurnoManualConfirmado(
  db: Db,
  input: InsertTurnoManualInput,
): Promise<{ insertedId: ObjectId }> {
  const now = new Date();
  const insertedId = new ObjectId();

  const turnoDetalle = buildTurnoDetalleFromCitas({
    citas: input.citas,
    modalidad: input.modalidad,
    formatoConsulta: input.formatoConsulta,
    formatoEvaluacion: input.formatoEvaluacion,
  });

  await db.collection("turnos").insertOne({
    _id: insertedId,
    nombre: input.nombre,
    mail: input.mail,
    celular: input.celular,
    celularDigits: canonicalPhoneDigitsAR(input.celular) || undefined,
    motivo: input.motivo,
    modalidad: input.modalidad,
    horario: input.horario,
    turnoDetalle,
    turnoCodigo: `panel_manual|${input.modalidad}|${insertedId.toHexString()}`,
    citas: input.citas,
    blockingSlotKeys: blockingSlotKeysFromCitas(input.citas),
    ...(input.modalidad === "consulta_individual" && input.formatoConsulta
      ? { formatoConsulta: input.formatoConsulta }
      : {}),
    ...(input.modalidad === "grupal" && input.horarioEvaluacion && input.formatoEvaluacion
      ? {
          horarioEvaluacion: input.horarioEvaluacion,
          formatoEvaluacion: input.formatoEvaluacion,
        }
      : {}),
    precioReferenciaArs:
      input.modalidad === "grupal" ? PRECIO_GRUPAL_MENSUAL : PRECIO_CONSULTA_INDIVIDUAL,
    estado: "confirmado",
    notaInterna: input.notaInterna?.trim() ? input.notaInterna.trim().slice(0, 2000) : "",
    confirmedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return { insertedId };
}
