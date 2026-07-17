"use client";

import { useLogoAccent } from "./LogoAccentContext";
import { event as gaEvent } from "../../lib/gtag";

export default function HeroAgendarCta() {
  const { accentColor, isLogoV2 } = useLogoAccent();

  return (
    <a
      href="#formulario-reserva"
      onClick={() => {
        gaEvent("agendar_evaluacion_click", {
          location: "hero",
        });
      }}
      className="hero-cta mt-6 inline-flex items-center gap-2 rounded-xl px-8 py-4 font-semibold shadow-lg transition hover:shadow-xl sm:mt-8"
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
