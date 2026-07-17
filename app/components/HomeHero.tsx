"use client";

import { heroBandBg } from "../lib/brand-colors";
import HeroAgendarCta from "./HeroAgendarCta";
import HeroLogoToggle from "./HeroLogoToggle";
import { useLogoAccent } from "./LogoAccentContext";

export default function HomeHero() {
  const { isLogoV2 } = useLogoAccent();

  const heroBg = heroBandBg(isLogoV2);
  const mainTextColor = isLogoV2 ? "#7a2d16" : "#ffffff";
  const secondaryTextColor = isLogoV2 ? "#8b3a20" : "rgba(255,255,255,0.92)";

  return (
    <section
      id="inicio"
      className="hero-home relative flex flex-col items-center justify-start overflow-x-hidden px-6 pb-8 pt-1 text-center transition-colors duration-300 sm:min-h-[100svh] sm:justify-center sm:pb-14 sm:pt-0 md:pb-16 lg:pb-[4.5rem]"
      style={{ backgroundColor: heroBg }}
    >
      <div className="hero-content relative z-10 flex max-w-2xl flex-col items-center pt-14 text-center sm:pt-0 md:-translate-y-3 lg:-translate-y-4">
        <HeroLogoToggle />
        <p
          className="mt-3 text-sm font-medium tracking-wide sm:mt-4 sm:text-base"
          style={{ color: secondaryTextColor }}
        >
          Conciencia Corporal y Movimiento
        </p>
        <p
          className="mt-1 text-xs tracking-widest sm:text-sm"
          style={{ color: secondaryTextColor }}
        >
          WANDA PERRIN | Lic. en Kinesiología y Fisiatría
        </p>
        <h1
          className="mt-4 whitespace-nowrap text-base font-bold tracking-tight drop-shadow-sm sm:mt-6 sm:text-3xl md:text-4xl lg:text-5xl"
          style={{ color: mainTextColor }}
        >
          SENTITE PLENO HABITANDO TU CUERPO
        </h1>
        <HeroAgendarCta />
      </div>
    </section>
  );
}
