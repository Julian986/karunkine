"use client";

import { useLogoAccent } from "./LogoAccentContext";

export default function HeroAgendarCta() {
  const { accentColor, isLogoV2 } = useLogoAccent();

  return (
    <a
      href="#formulario-reserva"
      className="hero-cta mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 font-semibold shadow-lg transition hover:shadow-xl"
      style={
        isLogoV2
          ? { backgroundColor: accentColor, color: "#ffffff" }
          : { backgroundColor: "#ffffff", color: accentColor }
      }
    >
      AGENDAR EVALUACIÓN
      <span aria-hidden>➜</span>
    </a>
  );
}
