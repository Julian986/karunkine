"use client";

import { useLogoAccent } from "./LogoAccentContext";

export default function HeroAgendarCta() {
  const { accentColor } = useLogoAccent();

  return (
    <a
      href="#formulario-reserva"
      className="hero-cta mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold shadow-lg transition hover:bg-white/95 hover:shadow-xl"
      style={{ color: accentColor }}
    >
      AGENDAR EVALUACIÓN
      <span aria-hidden>➜</span>
    </a>
  );
}
