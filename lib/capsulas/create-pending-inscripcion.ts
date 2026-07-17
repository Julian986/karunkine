import { ObjectId } from "mongodb";

import { canonicalPhoneDigitsAR } from "../customer/phone-canonical-ar";
import { getReservaPagoTimeoutMs } from "../mercadopago/env";
import { getDb } from "../mongodb";
import type { CrearCapsulasInscripcionInput } from "../validators/capsulas-inscripcion";
import type { CapsulaMovimientoConfig, CapsulasMovimientoCicloConfig } from "./config";

export type CapsulasInscripcionEstado = "pending_payment" | "confirmado" | "expirado" | "cancelado";

export type CapsulaMovimientoSnapshot = {
  id: string;
  dateKey: string;
  nombre: string;
  subtitulo: string;
  horario: string;
  lugar: string;
};

export type CapsulasInscripcionDoc = {
  _id: ObjectId;
  cicloSlug: string;
  cicloTitulo: string;
  cicloMesLabel: string;
  nombre: string;
  mail: string;
  celular: string;
  celularDigits?: string;
  capsulaIds: string[];
  capsulas: CapsulaMovimientoSnapshot[];
  precioUnitarioArs: number;
  precioReferenciaArs: number;
  estado: CapsulasInscripcionEstado;
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

export function snapshotCapsula(
  ciclo: CapsulasMovimientoCicloConfig,
  item: CapsulaMovimientoConfig,
): CapsulaMovimientoSnapshot {
  return {
    id: item.id,
    dateKey: item.dateKey,
    nombre: item.nombre,
    subtitulo: item.subtitulo,
    horario: ciclo.horario,
    lugar: ciclo.lugar,
  };
}

export async function insertarCapsulasInscripcionPendienteDePago(
  ciclo: CapsulasMovimientoCicloConfig,
  data: CrearCapsulasInscripcionInput,
  capsulas: CapsulaMovimientoConfig[],
): Promise<{ insertedId: ObjectId }> {
  const db = await getDb();
  const now = new Date();
  const timeoutMs = getReservaPagoTimeoutMs();
  const insertedId = new ObjectId();
  const externalReference = insertedId.toString();
  const precioTotal = ciclo.precioArs * capsulas.length;

  const doc: CapsulasInscripcionDoc = {
    _id: insertedId,
    cicloSlug: ciclo.slug,
    cicloTitulo: ciclo.titulo,
    cicloMesLabel: ciclo.mesLabel,
    nombre: data.nombre.trim(),
    mail: data.mail.trim(),
    celular: data.celular.trim(),
    celularDigits: canonicalPhoneDigitsAR(data.celular) || undefined,
    capsulaIds: capsulas.map((item) => item.id),
    capsulas: capsulas.map((item) => snapshotCapsula(ciclo, item)),
    precioUnitarioArs: ciclo.precioArs,
    precioReferenciaArs: precioTotal,
    estado: "pending_payment",
    externalReference,
    paymentExpiresAt: new Date(now.getTime() + timeoutMs),
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<CapsulasInscripcionDoc>("capsulas_inscripciones").insertOne(doc);
  return { insertedId };
}
