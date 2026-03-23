"use client";

import { useLogoAccent } from "./LogoAccentContext";

export default function ConsultaAgendarCta() {
  const { accentColor } = useLogoAccent();

  return (
    <a
      href="#formulario-reserva"
      className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition hover:opacity-90"
      style={{ backgroundColor: accentColor }}
    >
      AGENDAR EVALUACIÓN
      <span aria-hidden>➜</span>
    </a>
  );
}
