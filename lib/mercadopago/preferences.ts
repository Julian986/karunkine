import { getAppPublicBaseUrl } from "./env";
import { mpFetchJson } from "./http";
import type { MercadoPagoPreferenceResponse } from "./types";

export type CrearPreferenciaInput = {
  /** external_reference en MP = id del turno (string ObjectId) */
  externalReference: string;
  tituloItem: string;
  precioArs: number;
  nombrePagador: string;
  emailPagador: string;
};

/**
 * Checkout Pro — creación de preferencia.
 * @see https://www.mercadopago.com.ar/developers/es/reference/preferences/_checkout_preferences/post
 */
export async function crearPreferenciaCheckoutPro(
  input: CrearPreferenciaInput
): Promise<{ preferenceId: string; initPoint: string }> {
  const base = getAppPublicBaseUrl();
  const notificationUrl = `${base}/api/webhooks/mercadopago`;
  const backUrls = {
    success: `${base}/reserva/resultado?estado=success`,
    failure: `${base}/reserva/resultado?estado=failure`,
    pending: `${base}/reserva/resultado?estado=pending`,
  };

  const body = {
    items: [
      {
        title: input.tituloItem.slice(0, 256),
        description: `Reserva — ref. ${input.externalReference}`.slice(0, 256),
        quantity: 1,
        currency_id: "ARS",
        unit_price: input.precioArs,
      },
    ],
    external_reference: input.externalReference,
    notification_url: notificationUrl,
    back_urls: backUrls,
    auto_return: "approved",
    payer: {
      name: input.nombrePagador.split(/\s+/)[0]?.slice(0, 255) || "Cliente",
      surname: input.nombrePagador.split(/\s+/).slice(1).join(" ").slice(0, 255) || "-",
      email: input.emailPagador,
    },
    statement_descriptor: "KARUN RESERVA".slice(0, 22),
    binary_mode: false,
  };

  const data = await mpFetchJson<MercadoPagoPreferenceResponse>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const preferenceId = data.id;
  const initPoint =
    data.init_point ||
    data.sandbox_init_point ||
    "";

  if (!preferenceId || !initPoint) {
    throw new Error("Mercado Pago no devolvió id o init_point de la preferencia.");
  }

  return { preferenceId, initPoint };
}
