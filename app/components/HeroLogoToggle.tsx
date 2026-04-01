"use client";

import Image from "next/image";
import { useLogoAccent } from "./LogoAccentContext";

const ISOTIPO_SRC = "/isotipo_logo.webp";
const KARUN_WORDMARK_SRC = "/karun_logo.webp";

export default function HeroLogoToggle() {
  const { isLogoV2, toggleLogo } = useLogoAccent();

  const focusRing =
    isLogoV2
      ? "focus-visible:ring-2 focus-visible:ring-[#963417] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e3d3b4]"
      : "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#963417]";

  return (
    <button
      type="button"
      onClick={toggleLogo}
      className={`group flex flex-col items-center gap-0 rounded-2xl px-2 py-1 outline-none transition-transform duration-200 hover:opacity-95 active:scale-[0.99] sm:gap-0.5 ${focusRing}`}
      aria-label={
        isLogoV2
          ? "Mostrar variante de color 1 (clic para cambiar acentos)"
          : "Mostrar variante de color 2 (clic para cambiar acentos)"
      }
      aria-pressed={isLogoV2}
    >
      <Image
        src={ISOTIPO_SRC}
        alt=""
        width={240}
        height={240}
        priority
        quality={92}
        sizes="(max-width: 640px) 55vw, 240px"
        className="hero-logo-isotipo mt-0.5 h-[clamp(11.45rem,41vw,16.65rem)] w-auto max-w-[min(89vw,21.75rem)] translate-y-1 object-contain object-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.18)] transition-transform duration-200 group-hover:scale-[1.02] sm:h-[clamp(13.1rem,37vw,18.45rem)] sm:max-w-[min(87vw,25.75rem)] sm:translate-y-1.5"
      />
      <Image
        src={KARUN_WORDMARK_SRC}
        alt="KARÜN"
        width={320}
        height={96}
        priority
        quality={92}
        sizes="(max-width: 640px) 78vw, 320px"
        className="hero-logo-wordmark -mt-[1.4375rem] h-[clamp(2.15rem,7.5vw,3.35rem)] w-auto max-w-[min(92vw,24rem)] -translate-y-[0.5625rem] object-contain object-center drop-shadow-[0_1px_8px_rgba(0,0,0,0.12)] sm:-mt-[1.75rem] sm:-translate-y-[0.6875rem]"
      />
    </button>
  );
}
