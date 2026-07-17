"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import BrandBandSection from "./BrandBandSection";

const espacioImages = [
  {
    id: "consultorio-general",
    src: "/espacio/consultorio-general.webp",
    alt: "Vista general del centro Karün: escritorio de evaluación, estantería y camilla al fondo.",
    gridClass: "md:col-span-8 md:row-span-2 md:h-full",
    aspectClass: "aspect-[4/5] md:aspect-auto md:h-full md:min-h-[28rem]",
    sizes: "(max-width: 768px) 85vw, 66vw",
  },
  {
    id: "area-evaluacion",
    src: "/espacio/area-evaluacion.webp",
    alt: "Área de evaluación con camilla, espejo y mural de montañas en tonos tierra.",
    gridClass: "md:col-span-4",
    aspectClass: "aspect-[4/5]",
    sizes: "(max-width: 768px) 85vw, 33vw",
  },
  {
    id: "espacio-movimiento",
    src: "/espacio/espacio-movimiento.webp",
    alt: "Espacio de movimiento con espaldera, bandas y mural del centro Karün.",
    gridClass: "md:col-span-4",
    aspectClass: "aspect-[4/5]",
    sizes: "(max-width: 768px) 85vw, 33vw",
  },
  {
    id: "espaldera",
    src: "/espacio/espaldera.webp",
    alt: "Espaldera con pelotas y bandas de resistencia sobre el mural del centro Karün.",
    gridClass: "md:col-span-3",
    aspectClass: "aspect-[4/5] md:aspect-square",
    sizes: "(max-width: 768px) 85vw, 25vw",
  },
  {
    id: "ingreso",
    src: "/espacio/ingreso.webp",
    alt: "Ingreso y recepción del centro Karün con escritorio y frente vidriado.",
    gridClass: "md:col-span-3",
    aspectClass: "aspect-[4/5] md:aspect-square",
    sizes: "(max-width: 768px) 85vw, 25vw",
  },
  {
    id: "equipamiento",
    src: "/espacio/equipamiento.webp",
    alt: "Detalle del equipamiento sobre el piso de caucho del espacio de movimiento.",
    gridClass: "md:col-span-3",
    aspectClass: "aspect-[4/5] md:aspect-square",
    sizes: "(max-width: 768px) 85vw, 25vw",
  },
  {
    id: "detalle-planta",
    src: "/espacio/detalle-planta.webp",
    alt: "Detalle de planta Monstera junto al separador de madera del centro Karün.",
    gridClass: "md:col-span-3",
    aspectClass: "aspect-[4/5] md:aspect-square",
    sizes: "(max-width: 768px) 85vw, 25vw",
  },
] as const;

function GalleryTile({
  src,
  alt,
  aspectClass,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  aspectClass: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <figure
      className={`group relative overflow-hidden rounded-2xl bg-[#963417]/10 ${aspectClass}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#963417]/0 transition-colors duration-500 group-hover:bg-[#963417]/15"
      />
    </figure>
  );
}

const iconChevronLeft = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const iconChevronRight = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

function EspacioMobileCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const syncActiveFromScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    let closest = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slideRefs.current.forEach((slide, index) => {
      if (!slide) return;
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(slideCenter - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }
    });

    setActiveIndex(closest);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    syncActiveFromScroll();
    scroller.addEventListener("scroll", syncActiveFromScroll, { passive: true });
    window.addEventListener("resize", syncActiveFromScroll);

    return () => {
      scroller.removeEventListener("scroll", syncActiveFromScroll);
      window.removeEventListener("resize", syncActiveFromScroll);
    };
  }, [syncActiveFromScroll]);

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(espacioImages.length - 1, index));
    const slide = slideRefs.current[next];
    if (!slide) return;
    slide.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveIndex(next);
  };

  return (
    <div className="md:hidden">
      <div className="relative">
        <button
          type="button"
          aria-label="Imagen anterior"
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="absolute left-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#963417]/20 bg-white/90 text-[#963417] shadow-md backdrop-blur-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-35 sm:left-2"
        >
          {iconChevronLeft}
        </button>

        <button
          type="button"
          aria-label="Imagen siguiente"
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === espacioImages.length - 1}
          className="absolute right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#963417]/20 bg-white/90 text-[#963417] shadow-md backdrop-blur-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-35 sm:right-2"
        >
          {iconChevronRight}
        </button>

        <div
          ref={scrollerRef}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-6 sm:gap-4 sm:px-6 [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label="Galería del espacio"
          aria-roledescription="carrusel"
        >
          {espacioImages.map((image, index) => (
            <div
              key={image.id}
              ref={(node) => {
                slideRefs.current[index] = node;
              }}
              className="w-[78vw] shrink-0 snap-center sm:w-[62vw]"
              role="listitem"
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <GalleryTile
                src={image.src}
                alt={image.alt}
                aspectClass="aspect-[4/5]"
                sizes={image.sizes}
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className="mt-5 flex items-center justify-center gap-2"
        role="tablist"
        aria-label="Indicadores de la galería"
      >
        {espacioImages.map((image, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-label={`Ir a imagen ${index + 1} de ${espacioImages.length}`}
              aria-selected={isActive}
              onClick={() => goTo(index)}
              className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#963417] ${
                isActive
                  ? "w-6 bg-[#963417]"
                  : "w-2.5 bg-[#963417]/30 hover:bg-[#963417]/50"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function HomeEspacioGallery() {
  const [showIntro, setShowIntro] = useState(false);

  return (
    <BrandBandSection id="el-espacio" band="alt" contentClassName="max-w-5xl">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setShowIntro((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#963417]/25 bg-white/80 text-[#963417] shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#963417]"
          aria-pressed={showIntro}
          aria-label={showIntro ? "Ocultar título y texto" : "Mostrar título y texto"}
          title={showIntro ? "Ocultar título y texto" : "Mostrar título y texto"}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            {showIntro ? (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </>
            ) : (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </>
            )}
          </svg>
        </button>
      </div>

      {showIntro && (
        <div className="mx-auto mb-10 max-w-2xl">
          <h2>EL ESPACIO</h2>
          <p className="mt-4">
            Un centro kinésico pensado para evaluar, moverse y acompañar procesos de salud: camilla,
            espejo, espaldera y un entorno cálido donde el cuerpo puede escucharse.
          </p>
        </div>
      )}

      <EspacioMobileCarousel />

      {/* Desktop / tablet: mosaico editorial asimétrico */}
      <div
        className={`hidden md:grid md:grid-cols-12 md:gap-4 ${showIntro ? "mt-0" : "mt-2"}`}
        role="list"
        aria-label="Galería del espacio"
      >
        {espacioImages.map((image, index) => (
          <div key={image.id} className={image.gridClass} role="listitem">
            <GalleryTile
              src={image.src}
              alt={image.alt}
              aspectClass={image.aspectClass}
              sizes={image.sizes}
              priority={index === 0}
            />
          </div>
        ))}
      </div>
    </BrandBandSection>
  );
}
