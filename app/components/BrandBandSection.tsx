"use client";

import type { ReactNode } from "react";
import { useLogoAccent } from "./LogoAccentContext";
import { BRAND_BG_DARK, altBandBg, heroBandBg } from "../lib/brand-colors";

type Band = "hero" | "alt";

export default function BrandBandSection({
  id,
  band,
  children,
  className = "",
  contentClassName = "max-w-2xl",
}: {
  id?: string;
  band: Band;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const { isLogoV2 } = useLogoAccent();
  const bg = band === "hero" ? heroBandBg(isLogoV2) : altBandBg(isLogoV2);
  const isDarkBand = bg === BRAND_BG_DARK;

  const typography = isDarkBand
    ? "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:sm:text-3xl [&_h2]:text-white [&_p]:text-white/90 [&_li]:text-white/90 [&_ul]:marker:text-white/70 [&_.brand-strong]:font-semibold [&_.brand-strong]:text-white"
    : "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:sm:text-3xl [&_h2]:text-[#5c2810] [&_p]:text-[#6b3014] [&_li]:text-[#6b3014] [&_ul]:marker:text-[#963417]/80 [&_.brand-strong]:font-semibold [&_.brand-strong]:text-[#5c2810]";

  return (
    <section
      id={id}
      className={`cv-auto px-4 py-14 transition-colors duration-300 sm:px-6 md:px-10 ${typography} ${className}`}
      style={{ backgroundColor: bg }}
    >
      <div className={`mx-auto leading-relaxed ${contentClassName}`}>{children}</div>
    </section>
  );
}
