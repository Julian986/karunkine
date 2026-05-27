"use client";

import { useLogoAccent } from "./LogoAccentContext";
import { event as gaEvent } from "../../lib/gtag";

export default function ConsultaAgendarCta() {
  const { accentColor } = useLogoAccent();

  return (
    <a
      href="#formulario-reserva"
      onClick={() => {
        gaEvent("agendar_evaluacion_click", {
          location: "consulta_section",
        });
      }}
      className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition hover:opacity-90"
      style={{ backgroundColor: accentColor }}
    >
      AGENDAR EVALUACIÓN
      <span aria-hidden>➜</span>
    </a>
  );
}
