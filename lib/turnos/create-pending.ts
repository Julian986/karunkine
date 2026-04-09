import { ObjectId } from "mongodb";
import { getDb } from "../mongodb";
import type { CrearReservaTurnoInput } from "../validators/reserva-turno";
import { getReservaPagoTimeoutMs } from "../mercadopago/env";

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
  data: CrearReservaTurnoInput
): Promise<{ insertedId: ObjectId }> {
  const db = await getDb();
  const now = new Date();
  const timeoutMs = getReservaPagoTimeoutMs();
  const insertedId = new ObjectId();
  const externalReference = insertedId.toString();

  const doc: TurnoInsertDoc = {
    _id: insertedId,
    nombre: data.nombre,
    mail: data.mail,
    celular: data.celular,
    motivo: data.motivo,
    modalidad: data.modalidad,
    horario: data.horario,
    turnoDetalle: data.turnoDetalle,
    turnoCodigo: data.turnoCodigo,
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
