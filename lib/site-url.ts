/**
 * URL canónica del sitio (HTTPS, sin barra final).
 * Definir NEXT_PUBLIC_SITE_URL en Vercel = https://karunkine.com para OG, canonical y metadataBase.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    const u = raw.replace(/\/$/, "");
    return u.startsWith("http") ? u : `https://${u}`;
  }
  return "https://karunkine.com";
}
