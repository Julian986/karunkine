import { TALLER_BAHIA_JUNIO_2026, type TallerEventoConfig } from "./evento-config";

export function getTallerEventoBySlug(slug: string): TallerEventoConfig | null {
  if (slug === TALLER_BAHIA_JUNIO_2026.slug) return TALLER_BAHIA_JUNIO_2026;
  return null;
}
