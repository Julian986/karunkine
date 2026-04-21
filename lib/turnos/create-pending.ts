import { ObjectId } from "mongodb";
import { getDb } from "../mongodb";
import type { CrearReservaTurnoInput } from "../validators/reserva-turno";
import { getReservaPagoTimeoutMs } from "../mercadopago/env";
import { blockingSlotKeysFromCitas, type CitaDoc } from "./wanda-schedule";
import { buildTurnoDetalleFromCitas } from "./turno-detalle-copy";

export type TurnoInsertDoc = {
  _id: ObjectId;
  nombre: string;
  mail: string;
  celular: string;
  motivo: string;
  modalidad: "grupal" | "consulta_individual";
  horario: string;
  turnoDetalle: string;
  turnoCodigo: string;
  formatoConsulta?: "presencial" | "virtual";
  horarioEvaluacion?: string;
  formatoEvaluacion?: "presencial" | "virtual";
  citas?: CitaDoc[];
  /** Índice único parcial: evita dos turnos activos con el mismo hueco (carrera entre POST). */
  blockingSlotKeys?: string[];
  precioReferenciaArs: number;
  estado: "pending_payment";
  notaInterna: string;
  externalReference: string;
  paymentExpiresAt: Date;
  mpPreferenceId?: string;
  mpPaymentId?: string;
  mpPaymentStatus?: string;
  mpLastNotificationAt?: Date;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export async function insertarTurnoPendienteDePago(
  data: CrearReservaTurnoInput & { citas: CitaDoc[] }
): Promise<{ insertedId: ObjectId }> {
  const db = await getDb();
  const now = new Date();
  const timeoutMs = getReservaPagoTimeoutMs();
  const insertedId = new ObjectId();
  const externalReference = insertedId.toString();

  const turnoDetalle = buildTurnoDetalleFromCitas({
    citas: data.citas,
    modalidad: data.modalidad,
    formatoConsulta: data.formatoConsulta,
    formatoEvaluacion: data.formatoEvaluacion,
  });

  const doc: TurnoInsertDoc = {
    _id: insertedId,
    nombre: data.nombre,
    mail: data.mail,
    celular: data.celular,
    motivo: data.motivo,
    modalidad: data.modalidad,
    horario: data.horario,
    turnoDetalle,
    turnoCodigo: data.turnoCodigo,
    citas: data.citas,
    blockingSlotKeys: blockingSlotKeysFromCitas(data.citas),
    ...(data.modalidad === "consulta_individual" && data.formatoConsulta
      ? { formatoConsulta: data.formatoConsulta }
      : {}),
    ...(data.modalidad === "grupal" && data.horarioEvaluacion && data.formatoEvaluacion
      ? {
          horarioEvaluacion: data.horarioEvaluacion,
          formatoEvaluacion: data.formatoEvaluacion,
        }
      : {}),
    precioReferenciaArs: data.precioReferenciaArs,
    estado: "pending_payment",
    notaInterna: "",
    externalReference,
    paymentExpiresAt: new Date(now.getTime() + timeoutMs),
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("turnos").insertOne(doc);
  return { insertedId };
}
