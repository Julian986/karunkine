"use client";

import dynamic from "next/dynamic";
import { altBandBg } from "../lib/brand-colors";
import { useLogoAccent } from "./LogoAccentContext";
import HomeTallerBanner from "./HomeTallerBanner";

const FormularioReserva = dynamic(() => import("./FormularioReserva"), {
  loading: () => (
    <div className="px-4 py-10 sm:px-6 md:px-10">
      <div className="mx-auto max-w-2xl">
        <div className="h-24 animate-pulse rounded-2xl bg-black/10" />
      </div>
    </div>
  ),
});

export default function HeroFormularioSection() {
  const { isLogoV2 } = useLogoAccent();
  const sectionBg = altBandBg(isLogoV2);

  return (
    <section
      className="hero-formulario-section relative z-10 -mt-4 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.06)] transition-colors duration-300 sm:-mt-3 md:-mt-2 lg:mt-0"
      style={{ backgroundColor: sectionBg }}
    >
      <HomeTallerBanner />
      <FormularioReserva />
    </section>
  );
}
