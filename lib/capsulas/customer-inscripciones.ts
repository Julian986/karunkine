import type { Db, Document } from "mongodb";

import { customerPhoneDigitsQueryValues } from "../customer/phone-canonical-ar";
import type { CapsulasInscripcionDoc, CapsulasInscripcionEstado } from "./create-pending-inscripcion";
import { formatCapsulaFecha } from "./config";

export type CustomerCapsulaInscripcionPublic = {
  id: string;
  compraId: string;
  cicloSlug: string;
  cicloTitulo: string;
  cicloMesLabel: string;
  capsulaNombre: string;
  capsulaSubtitulo: string;
  capsulaFecha: string;
  capsulaHorario: string;
  estado: CapsulasInscripcionEstado;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildCapsulasInscripcionListFilter(sessionDigits: string): Document {
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

export async function listCustomerCapsulasInscripciones(
  db: Db,
  sessionDigits: string,
): Promise<CustomerCapsulaInscripcionPublic[]> {
  const rows = await db
    .collection<CapsulasInscripcionDoc>("capsulas_inscripciones")
    .find(buildCapsulasInscripcionListFilter(sessionDigits))
    .sort({ createdAt: -1 })
    .toArray();

  const out: CustomerCapsulaInscripcionPublic[] = [];
  for (const row of rows) {
    for (const capsula of row.capsulas ?? []) {
      out.push({
        id: `${row._id.toString()}:${capsula.id}`,
        compraId: row._id.toString(),
        cicloSlug: row.cicloSlug,
        cicloTitulo: row.cicloTitulo,
        cicloMesLabel: row.cicloMesLabel,
        capsulaNombre: capsula.nombre,
        capsulaSubtitulo: capsula.subtitulo,
        capsulaFecha: `${formatCapsulaFecha(capsula.dateKey)} · ${capsula.horario}H`,
        capsulaHorario: capsula.horario,
        estado: row.estado,
      });
    }
  }
  return out.sort((a, b) => a.capsulaFecha.localeCompare(b.capsulaFecha));
}

export function customerCapsulasEstadoLabel(estado: CapsulasInscripcionEstado): string {
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
