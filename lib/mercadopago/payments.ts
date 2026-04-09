import { mpFetchJson } from "./http";
import type { MercadoPagoMerchantOrder, MercadoPagoPayment } from "./types";

export async function obtenerPagoPorId(paymentId: string): Promise<MercadoPagoPayment> {
  const id = encodeURIComponent(paymentId);
  return mpFetchJson<MercadoPagoPayment>(`/v1/payments/${id}`, { method: "GET" });
}

export async function obtenerMerchantOrder(orderId: string): Promise<MercadoPagoMerchantOrder> {
  const id = encodeURIComponent(orderId);
  return mpFetchJson<MercadoPagoMerchantOrder>(`/merchant_orders/${id}`, {
    method: "GET",
  });
}
