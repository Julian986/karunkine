/** Respuesta parcial GET /v1/payments/{id} */
export type MercadoPagoPayment = {
  id?: number | string;
  status?: string;
  status_detail?: string;
  external_reference?: string | null;
  transaction_amount?: number;
  currency_id?: string;
  date_approved?: string | null;
};

export type MercadoPagoPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
};

export type MercadoPagoMerchantOrder = {
  id?: number | string;
  payments?: Array<{ id?: number | string; status?: string }>;
};
