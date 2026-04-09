function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    throw new Error(`Falta variable de entorno obligatoria: ${name}`);
  }
  return v.trim();
}

export function getMercadoPagoAccessToken(): string {
  return requireEnv("MERCADOPAGO_ACCESS_TOKEN");
}

/**
 * URL pública HTTPS de la app (sin barra final), ej. https://tudominio.com
 * Usada para notification_url y back_urls.
 */
export function getAppPublicBaseUrl(): string {
  const raw =
    process.env.APP_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";
  if (!raw) {
    throw new Error(
      "Definí APP_PUBLIC_BASE_URL o NEXT_PUBLIC_APP_URL (HTTPS en producción) para webhooks y retornos de Checkout Pro."
    );
  }
  return raw.replace(/\/+$/, "");
}

export function getReservaPagoTimeoutMs(): number {
  const h = Number(process.env.RESERVA_PAGO_TIMEOUT_HOURS ?? "24");
  const hours = Number.isFinite(h) && h > 0 ? Math.min(h, 168) : 24;
  return hours * 60 * 60 * 1000;
}

export function getCronSecret(): string | null {
  return process.env.CRON_SECRET?.trim() || null;
}
