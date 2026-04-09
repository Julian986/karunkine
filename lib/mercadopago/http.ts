import { getMercadoPagoAccessToken } from "./env";

const MP_BASE = "https://api.mercadopago.com";

export class MercadoPagoApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: string
  ) {
    super(message);
    this.name = "MercadoPagoApiError";
  }
}

export async function mpFetchJson<T>(
  path: string,
  init?: RequestInit & { method?: string }
): Promise<T> {
  const token = getMercadoPagoAccessToken();
  const url = path.startsWith("http") ? path : `${MP_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new MercadoPagoApiError(
      `Mercado Pago API ${res.status}: ${path}`,
      res.status,
      text.slice(0, 2000)
    );
  }

  try {
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    throw new MercadoPagoApiError("Respuesta JSON inválida de Mercado Pago", res.status, text);
  }
}
