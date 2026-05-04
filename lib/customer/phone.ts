/** Solo dígitos, para cruzar reservas con el mismo WhatsApp aunque el formato varíe. */
export function normalizePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isLikelyWhatsappNumber(raw: string): boolean {
  const digits = normalizePhoneDigits(raw);
  return digits.length >= 10 && digits.length <= 15;
}
