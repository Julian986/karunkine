"use client";

import Link from "next/link";

import { event as gaEvent } from "../../lib/gtag";
import { getActiveTallerEvento } from "../../lib/taller/get-evento";
import { useLogoAccent, hexToRgba } from "./LogoAccentContext";

export default function HomeTallerBanner() {
  const evento = getActiveTallerEvento();
  const { accentColor, isLogoV2 } = useLogoAccent();

  if (!evento) return null;

  const href = `/${evento.slug}`;
  const horarioDisplay = evento.horario.replace(/\s*h$/i, "H");

  return (
    <div className="px-4 pt-8 sm:px-6 md:px-10">
      <div
        className={`mx-auto max-w-2xl rounded-2xl border px-5 py-4 shadow-[0_4px_20px_rgba(61,32,16,0.08)] sm:px-6 sm:py-5 ${
          isLogoV2
            ? "border-[#963417]/20 bg-white"
            : "border-white/25 bg-white/95 backdrop-blur-sm"
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#963417]/80">
          {evento.subtitulo}
        </p>
        <p className="mt-1 text-lg font-bold leading-snug text-[#5c2810] sm:text-xl">
          Taller — {evento.titulo}
        </p>
        <p className="mt-2 text-[14px] font-medium text-[#6b3014]">
          {evento.fecha} · {horarioDisplay}
        </p>
        <Link
          href={href}
          prefetch
          onClick={() => {
            gaEvent("taller_home_banner_click", {
              evento_slug: evento.slug,
            });
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[14px] font-semibold transition hover:opacity-90"
          style={{
            borderColor: hexToRgba(accentColor, 0.35),
            color: accentColor,
            backgroundColor: hexToRgba(accentColor, 0.08),
          }}
        >
          Ver taller e inscribirme
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
