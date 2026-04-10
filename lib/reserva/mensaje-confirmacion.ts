const LINEA_ROPA = "Recordá usar ropa cómoda/deportiva.";

/**
 * Mensaje post-pago cuando la reserva quedó confirmada (polling a /api/reservas/:id/estado).
 */
export function mensajeConfirmacionReserva(params: {
  modalidad: string;
  turnoDetalle: string;
}): string {
  const det = params.turnoDetalle.trim();

  if (params.modalidad === "consulta_individual") {
    const m = det.match(/^(.+?)\s+(\d{1,2}:\d{2}H|\d{1,2}H)$/);
    if (m) {
      const diaRaw = m[1].trim();
      const hora = m[2];
      const dia =
        diaRaw.length > 0
          ? diaRaw.charAt(0).toLocaleUpperCase("es-AR") + diaRaw.slice(1).toLowerCase()
          : diaRaw;
      return `¡Gracias! Nos vemos el ${dia} a las ${hora} 😊\n\n${LINEA_ROPA}`;
    }
    return `¡Gracias! Tu consulta individual quedó confirmada.${det ? ` (${det})` : ""} 😊\n\n${LINEA_ROPA}`;
  }

  if (params.modalidad === "grupal") {
    return `¡Gracias! Tu reserva de clases grupales quedó confirmada.${det ? ` Horario: ${det}.` : ""} 😊\n\n${LINEA_ROPA}`;
  }

  return `¡Gracias! Tu reserva quedó confirmada.${det ? ` ${det}.` : ""} 😊\n\n${LINEA_ROPA}`;
}
