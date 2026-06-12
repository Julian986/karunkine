import type { Db, Document } from "mongodb";

import { customerPhoneDigitsQueryValues } from "../customer/phone-canonical-ar";
import type { TallerInscripcionDoc, TallerInscripcionEstado } from "./create-pending-inscripcion";

export type CustomerTallerInscripcionPublic = {
  id: string;
  eventoSlug: string;
  eventoTitulo: string;
  eventoFecha: string;
  estado: TallerInscripcionEstado;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildTallerInscripcionListFilter(sessionDigits: string): Document {
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
  return { $or: or, estado: { $ne: "cancelado" } };
}

export async function listCustomerTallerInscripciones(
  db: Db,
  sessionDigits: string,
): Promise<CustomerTallerInscripcionPublic[]> {
  const rows = await db
    .collection<TallerInscripcionDoc>("taller_inscripciones")
    .find(buildTallerInscripcionListFilter(sessionDigits))
    .sort({ createdAt: -1 })
    .toArray();

  return rows.map((doc) => ({
    id: doc._id.toString(),
    eventoSlug: doc.eventoSlug,
    eventoTitulo: doc.eventoTitulo,
    eventoFecha: doc.eventoFecha,
    estado: doc.estado,
  }));
}

export function customerTallerInscripcionEstadoLabel(estado: TallerInscripcionEstado): string {
  switch (estado) {
    case "confirmado":
      return "Confirmada";
    case "pending_payment":
      return "Pago pendiente";
    case "expirado":
      return "Expirada";
    case "cancelado":
      return "Cancelada";
    default:
      return estado;
  }
}
