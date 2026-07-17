import type { Db } from "mongodb";

import { utcTodayDateKey } from "../turnos/wanda-schedule";
import type { CapsulaMovimientoConfig, CapsulasMovimientoCicloConfig } from "./config";
import type { CapsulasInscripcionDoc } from "./create-pending-inscripcion";

const ESTADOS_OCUPAN_CUPO = ["pending_payment", "confirmado"] as const;

export type CapsulaDisponibilidadPublica = {
  id: string;
  dateKey: string;
  nombre: string;
  subtitulo: string;
  horario: string;
  lugar: string;
  cupoTotal: number;
  cupoDisponible: number;
  agotada: boolean;
};

async function countReservasActivasPorCapsula(
  db: Db,
  cicloSlug: string,
  capsulaIds: readonly string[],
): Promise<Map<string, number>> {
  const rows = await db
    .collection<CapsulasInscripcionDoc>("capsulas_inscripciones")
    .find({
      cicloSlug,
      estado: { $in: ESTADOS_OCUPAN_CUPO },
      capsulaIds: { $in: [...capsulaIds] },
    })
    .project({ capsulaIds: 1 })
    .toArray();

  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const id of row.capsulaIds ?? []) {
      if (!capsulaIds.includes(id)) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}

export async function listCapsulasDisponiblesPublicas(
  db: Db,
  ciclo: CapsulasMovimientoCicloConfig,
): Promise<CapsulaDisponibilidadPublica[]> {
  const items = ciclo.items.filter((item) => item.dateKey >= utcTodayDateKey());
  const counts = await countReservasActivasPorCapsula(
    db,
    ciclo.slug,
    items.map((item) => item.id),
  );

  return items.map((item) => {
    const ocupados = counts.get(item.id) ?? 0;
    const cupoDisponible = Math.max(0, ciclo.cupo - ocupados);
    return {
      id: item.id,
      dateKey: item.dateKey,
      nombre: item.nombre,
      subtitulo: item.subtitulo,
      horario: ciclo.horario,
      lugar: ciclo.lugar,
      cupoTotal: ciclo.cupo,
      cupoDisponible,
      agotada: cupoDisponible <= 0,
    };
  });
}

export async function resolveCapsulasSeleccionadas(
  db: Db,
  ciclo: CapsulasMovimientoCicloConfig,
  capsulaIds: readonly string[],
): Promise<{ ok: true; capsulas: CapsulaMovimientoConfig[] } | { ok: false; error: string; code: string }> {
  const ids = [...new Set(capsulaIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    return { ok: false, error: "Elegí al menos una cápsula.", code: "NO_CAPSULAS" };
  }

  const visibles = ciclo.items.filter((item) => item.dateKey >= utcTodayDateKey());
  const byId = new Map(visibles.map((item) => [item.id, item] as const));
  const seleccionadas: CapsulaMovimientoConfig[] = [];
  for (const id of ids) {
    const item = byId.get(id);
    if (!item) {
      return { ok: false, error: "Alguna cápsula ya no está disponible.", code: "CAPSULA_INVALIDA" };
    }
    seleccionadas.push(item);
  }

  const counts = await countReservasActivasPorCapsula(db, ciclo.slug, ids);
  for (const item of seleccionadas) {
    const ocupados = counts.get(item.id) ?? 0;
    if (ocupados >= ciclo.cupo) {
      return {
        ok: false,
        error: `La cápsula "${item.nombre}" ya no tiene cupo disponible.`,
        code: "CAPSULA_SIN_CUPO",
      };
    }
  }

  return { ok: true, capsulas: seleccionadas };
}
