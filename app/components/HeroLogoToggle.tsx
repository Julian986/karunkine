"use client";

import Image from "next/image";
import { useLogoAccent } from "./LogoAccentContext";

const LOGO_V1 = "/02-LOGO%2001-VER%2001.webp";
const LOGO_V2 = "/02-LOGO%2001-VER%2002.webp";

export default function HeroLogoToggle() {
  const { isLogoV2, toggleLogo } = useLogoAccent();

  const src = isLogoV2 ? LOGO_V2 : LOGO_V1;

  return (
    <button
      type="button"
      onClick={toggleLogo}
      className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
      aria-label={
        isLogoV2
          ? "Mostrar logo versión 1 (clic para cambiar)"
          : "Mostrar logo versión 2 (clic para cambiar)"
      }
      aria-pressed={isLogoV2}
    >
      <Image
        key={src}
        src={src}
        alt="Conciencia Corporal y Movimiento - Wanda Perrin"
        width={176}
        height={176}
        sizes="(max-width: 640px) 144px, (max-width: 768px) 160px, 176px"
        quality={75}
        priority
        className="h-36 w-36 rounded-full object-cover drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.02] group-active:scale-[0.98] sm:h-40 sm:w-40 md:h-44 md:w-44"
      />
    </button>
  );
}
