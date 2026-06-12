import { ObjectId } from "mongodb";
import { canonicalPhoneDigitsAR } from "../customer/phone-canonical-ar";
import { getReservaPagoTimeoutMs } from "../mercadopago/env";
import { getDb } from "../mongodb";
import type { TallerEventoConfig } from "./evento-config";
import type { CrearTallerInscripcionInput } from "../validators/taller-inscripcion";

export type TallerInscripcionEstado = "pending_payment" | "confirmado" | "expirado" | "cancelado";

export type TallerInscripcionDoc = {
  _id: ObjectId;
  eventoSlug: string;
  eventoTitulo: string;
  eventoFecha: string;
  nombre: string;
  mail: string;
  celular: string;
  celularDigits?: string;
  comentario: string;
  precioReferenciaArs: number;
  estado: TallerInscripcionEstado;
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

export async function insertarInscripcionTallerPendienteDePago(
  evento: TallerEventoConfig,
  data: CrearTallerInscripcionInput,
): Promise<{ insertedId: ObjectId }> {
  const db = await getDb();
  const now = new Date();
  const timeoutMs = getReservaPagoTimeoutMs();
  const insertedId = new ObjectId();
  const externalReference = insertedId.toString();

  const doc: TallerInscripcionDoc = {
    _id: insertedId,
    eventoSlug: evento.slug,
    eventoTitulo: evento.titulo,
    eventoFecha: evento.fecha,
    nombre: data.nombre,
    mail: data.mail.trim(),
    celular: data.celular,
    celularDigits: canonicalPhoneDigitsAR(data.celular) || undefined,
    comentario: data.comentario ?? "",
    precioReferenciaArs: evento.precioArs,
    estado: "pending_payment",
    externalReference,
    paymentExpiresAt: new Date(now.getTime() + timeoutMs),
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<TallerInscripcionDoc>("taller_inscripciones").insertOne(doc);
  return { insertedId };
}
