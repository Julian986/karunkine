import { formatCapsulaFecha, type CapsulasMovimientoCicloConfig } from "./config";
import type { CapsulaMovimientoSnapshot } from "./create-pending-inscripcion";

export function buildCapsulasCheckoutItemCopy(
  ciclo: CapsulasMovimientoCicloConfig,
  capsulas: readonly CapsulaMovimientoSnapshot[],
): {
  tituloItem: string;
  descripcionItem: string;
} {
  const tituloItem =
    capsulas.length === 1
      ? `Cápsula ${capsulas[0]?.nombre ?? ""} — ${formatCapsulaFecha(capsulas[0]?.dateKey ?? "")}`
      : `${ciclo.titulo} — ${capsulas.length} cápsulas`;

  const primera = capsulas[0];
  const descripcionItem =
    capsulas.length === 1 && primera
      ? `${formatCapsulaFecha(primera.dateKey)} · ${primera.horario} · ${primera.nombre}. ${primera.lugar}.`
      : `${ciclo.mesLabel}. ${capsulas.length} cápsulas seleccionadas. ${ciclo.lugar} · ${ciclo.horario} hs.`;

  return { tituloItem, descripcionItem };
}
