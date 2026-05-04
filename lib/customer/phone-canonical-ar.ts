import { normalizePhoneDigits } from "./phone";

/**
 * Clave canónica para cruzar el mismo WhatsApp argentino en cualquier formato.
 * Alineado con el criterio usado en producción (salón Marcelo / Karunkine).
 */
export function canonicalPhoneDigitsAR(raw: string): string {
  const d = normalizePhoneDigits(raw);
  if (!d) return "";

  if (d.startsWith("549")) return d;
  if (d.startsWith("54")) return d;

  if (d.startsWith("0") && d.length >= 9 && d.length <= 12) {
    return `549${d.slice(1)}`;
  }

  if (d.startsWith("9") && d.length === 11) {
    return `549${d.slice(1)}`;
  }

  if (d.length >= 8 && d.length <= 11) {
    return `549${d}`;
  }

  return d;
}

/** Variantes de dígitos guardadas en DB (normalización histórica). */
export function customerPhoneDigitsQueryValues(canonical: string): string[] {
  const s = new Set<string>();
  if (canonical) s.add(canonical);

  if (canonical.startsWith("549") && canonical.length >= 11) {
    const rest = canonical.slice(3);
    const last10 = rest.length >= 10 ? rest.slice(-10) : rest;

    s.add(rest);
    s.add(last10);
    s.add(`5499${last10}`);
    s.add(`5490${last10}`);
    s.add(`54${last10}`);

    if (rest !== last10) {
      s.add(`5499${rest}`);
      s.add(`5490${rest}`);
      s.add(`54${rest}`);
    }
  }

  return [...s];
}
