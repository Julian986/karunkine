/** Colores de marca (fondos alternados de la home). */
export const BRAND_BG_DARK = "#963417";
export const BRAND_BG_LIGHT = "#e3d3b4";

/** Misma banda que el hero (logo v1 → oscuro, logo v2 → claro). */
export function heroBandBg(isLogoV2: boolean): string {
  return isLogoV2 ? BRAND_BG_LIGHT : BRAND_BG_DARK;
}

/** Banda opuesta al hero (para área del formulario, FAQ, etc.). */
export function altBandBg(isLogoV2: boolean): string {
  return isLogoV2 ? BRAND_BG_DARK : BRAND_BG_LIGHT;
}

/** Texto principal según fondo oscuro o claro. */
export function bandTextPrimary(isDarkBand: boolean): string {
  return isDarkBand ? "#ffffff" : "#5c2810";
}

export function bandTextSecondary(isDarkBand: boolean): string {
  return isDarkBand ? "rgba(255,255,255,0.9)" : "#6b3014";
}
