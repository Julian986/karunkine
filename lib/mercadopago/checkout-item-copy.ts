/**
 * Textos del ítem en Checkout Pro: MP suele mostrar una sola línea corta en móvil (con …).
 * Título breve + descripción compacta mejora la lectura.
 */
export function buildCheckoutItemCopy(input: {
  modalidad: "grupal" | "consulta_individual";
  turnoDetalle: string;
  formatoConsulta?: "presencial" | "virtual" | null;
}): { tituloItem: string; descripcionItem: string } {
  const modalidadCorta =
    input.modalidad === "consulta_individual" ? "Individual" : "Grupal";

  let franja = String(input.turnoDetalle ?? "").trim();
  franja = franja.replace(/Martes y Jueves/gi, "Mar/Jue");
  franja = franja.replace(/Miércoles/gi, "Mié");
  franja = franja.replace(/Lunes/gi, "Lun");
  franja = franja.replace(/Viernes/gi, "Vie");

  if (franja && !/\bhs\b/i.test(franja)) {
    if (
      /\d{1,2}:\d{2}/.test(franja) &&
      !/\d{1,2}:\d{2}\s*H\b/i.test(franja)
    ) {
      franja = `${franja} hs`;
    }
  }

  const sufijoFormato =
    input.modalidad === "consulta_individual" && input.formatoConsulta
      ? input.formatoConsulta === "virtual"
        ? " · Virt."
        : " · Pres."
      : "";

  const descripcionItem = franja
    ? `${modalidadCorta} · ${franja}${sufijoFormato}`.slice(0, 256)
    : `${modalidadCorta}${sufijoFormato}`.slice(0, 256);

  return {
    tituloItem: "Reserva Karün",
    descripcionItem,
  };
}
