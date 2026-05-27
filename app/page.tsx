import dynamic from "next/dynamic";
import type { Metadata } from "next";
import BrandBandSection from "./components/BrandBandSection";
import ConsultaAgendarCta from "./components/ConsultaAgendarCta";
import HeroFormularioSection from "./components/HeroFormularioSection";
import HomeHero from "./components/HomeHero";
import { LogoAccentProvider } from "./components/LogoAccentContext";
import { BRAND_BG_LIGHT } from "./lib/brand-colors";
import { getSiteUrl } from "../lib/site-url";

const PreguntasFrecuentes = dynamic(() => import("./components/PreguntasFrecuentes"), {
  loading: () => (
    <section
      className="px-4 py-14 sm:px-6 md:px-10"
      style={{ backgroundColor: BRAND_BG_LIGHT }}
    >
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-semibold text-[#5c2810] sm:text-3xl">
          PREGUNTAS FRECUENTES
        </h2>
      </div>
    </section>
  ),
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Kinesiología en Bahía Blanca | Evaluación, consultas y clases grupales",
  description:
    "Karunkine de Wanda Perrin: kinesiología y fisiatría en Bahía Blanca. Reservá evaluación inicial, consulta individual presencial/online o clases grupales de conciencia corporal y movimiento.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "kinesiología bahía blanca",
    "kinesiología y fisiatría",
    "consulta kinesiológica presencial",
    "consulta kinesiológica online",
    "evaluación kinesiológica",
    "clases grupales conciencia corporal",
    "rehabilitación física",
  ],
  openGraph: {
    title: "Karunkine | Kinesiología en Bahía Blanca",
    description:
      "Reservá evaluación inicial, consulta individual o clases grupales con Wanda Perrin.",
    url: "/",
    type: "website",
  },
  twitter: {
    title: "Karunkine | Kinesiología en Bahía Blanca",
    description:
      "Reservá evaluación inicial, consulta individual o clases grupales con Wanda Perrin.",
  },
};

const schemaOrg = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Physiotherapy",
      "@id": `${siteUrl}/#business`,
      name: "Karunkine - Wanda Perrin",
      url: siteUrl,
      image: `${siteUrl}/og.jpg?v=7`,
      telephone: "+5492914296636",
      email: "lic.wandaperrin@gmail.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Viamonte 1233",
        addressLocality: "Bahía Blanca",
        addressRegion: "Buenos Aires",
        addressCountry: "AR",
      },
      sameAs: ["https://www.instagram.com/lic.wandaperrin"],
      areaServed: "Bahía Blanca",
    },
    {
      "@type": "Service",
      "@id": `${siteUrl}/#consulta-individual`,
      serviceType: "Consulta individual de kinesiología y fisiatría",
      provider: { "@id": `${siteUrl}/#business` },
      areaServed: "Bahía Blanca",
      availableChannel: {
        "@type": "ServiceChannel",
        serviceLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Viamonte 1233",
            addressLocality: "Bahía Blanca",
            addressCountry: "AR",
          },
        },
      },
      offers: {
        "@type": "Offer",
        price: "40000",
        priceCurrency: "ARS",
      },
    },
    {
      "@type": "Service",
      "@id": `${siteUrl}/#clases-grupales`,
      serviceType: "Clases regulares grupales con evaluación inicial",
      provider: { "@id": `${siteUrl}/#business` },
      areaServed: "Bahía Blanca",
      offers: {
        "@type": "Offer",
        price: "160000",
        priceCurrency: "ARS",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Cuánto dura una sesión?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Las sesiones regulares grupales tienen una duración estimada de 50 minutos.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cuánto dura la evaluación?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "La consulta inicial de evaluación tiene una duración estimada de 30 minutos.",
          },
        },
      ],
    },
  ],
};

export default function Home() {
  return (
    <LogoAccentProvider>
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
        <HomeHero />
        <HeroFormularioSection />

        <BrandBandSection id="sobre-nosotros" band="hero">
          <h2>NOSOTROS</h2>
          <div className="mt-6 space-y-4">
            <p>
              <span className="brand-strong">Misión:</span> Promover la salud y el bienestar para que
              las personas puedan habitar sus cuerpos —y el mundo— con plenitud y en coherencia con su
              esencia y sus sueños.
            </p>
            <p>
              <span className="brand-strong">Visión:</span> Guíar procesos de recuperación de la salud
              más conscientes y autónomos, acompañando a las personas a reconectar con su cuerpo y a
              despertar todo su potencial.
            </p>
          </div>
        </BrandBandSection>

        <BrandBandSection id="tratamiento" band="alt">
          <h2>TRATAMIENTO</h2>
          <div className="mt-6 space-y-4">
            <p>
              Además de lograr el objetivo específico de cada persona y cada sesión, el tratamiento
              busca generar la propia conciencia de movimiento normal y la capacidad de auto-regular
              el cuerpo físico con base en una perspectiva integral de la salud.
            </p>
            <p>
              Con esto en mente, el espacio invita a la auto-observación, a explorarnos y escucharnos
              para conocernos y conectar con nuestras necesidades biológicas hasta alcanzar ese estado
              de completo bienestar que entendemos por salud.
            </p>
            <p className="pt-2">Podemos iniciar éste proceso en dos modalidades:</p>
            <ul className="mt-2 list-disc space-y-6 pl-5">
              <li className="pl-1">
                <p className="brand-strong">
                  Por medio de CLASES REGULARES GRUPALES con evaluación previa.
                </p>
          {/*       <p className="mt-2">Los días Martes y Jueves</p>
                <p className="mt-2">En los siguientes horarios:</p>
                <p className="mt-1">9:30H • 10:30H • 16H • 17H</p> */}
                <p className="mt-2">Cada turno con un cupo máximo de 4 personas.</p>
                <p className="mt-2">
                  Con un valor mensual de $160.000 que incluye la consulta individual para evaluación.
                </p>
              </li>
              <li className="pl-1">
                <p className="brand-strong">Con la modalidad de CONSULTAS INDIVIDUALES.</p>
                <p className="mt-2">
                  Éstas tienen una duración estimada de 45&apos; y tienen un valor de $40.000.
                </p>
                <p className="mt-2">Podés elegir turno presencial u online, en estos horarios:</p>
                <div className="mt-1 space-y-1">
                  <p>Lunes: 14:00H • 15:00H</p>
                  <p>Martes: 9:30H</p>
                  <p>Miércoles: 14:00H • 15:00H • 16:00H</p>
                  <p>Jueves: 9:30H</p>
                </div>
              </li>
            </ul>
          </div>
        </BrandBandSection>

        <BrandBandSection id="consulta-inicial" band="hero">
          <h2>EVALUACIÓN</h2>
          <div className="mt-6 space-y-4">
            <p>
              La evaluación es un recorrido por tu historia corporal. Se trata de un espacio uno a uno
              destinado a conocer tu estado de salud actual, tu experiencia personal con la salud y el
              movimiento, tus hábitos y actividades diarias y los objetivos que te acercaron a la
              consulta.
            </p>
            <p>
              Con la información recopilada le damos forma al Plan Kinésico que detalla los ítems que
              abordaremos en sesión y se te facilitará vía WhatsApp en formato PDF.
            </p>
            <p>
              Junto con el plan kinésico te haré llegar la Guía de Hábitos para la Salud Integral, con
              las claves para que tu cuerpo responda de forma eficaz al tratamiento y puedas sostener
              los resultados en el tiempo.
            </p>
          </div>
          <div className="mt-8">
            <ConsultaAgendarCta />
          </div>
        </BrandBandSection>

        <div className="cv-auto">
          <PreguntasFrecuentes />
        </div>

        <section
          id="contacto"
          className="cv-auto relative px-4 py-16 sm:px-6 md:px-10"
          style={{ backgroundColor: "#963417" }}
        >
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Información de contacto
            </h2>
            <ul className="mt-10 space-y-8 text-white">
              <li className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center text-white/60">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-white/70">Ubicación</p>
                  <p className="mt-1 text-white">Viamonte 1233 | Bahía Blanca</p>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Viamonte%201233%2C%20Bah%C3%ADa%20Blanca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-[#963417] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    Ver en MAPS
                    <span aria-hidden>↗</span>
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center text-white/60">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-white/70">Teléfono</p>
                  <a href="tel:+5492914296636" className="mt-1 block text-white transition hover:text-[#e3d3b4]">
                    2914 29-6636
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center text-white/60">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-white/70">Mail</p>
                  <a href="mailto:lic.wandaperrin@gmail.com" className="mt-1 block text-white transition hover:text-[#e3d3b4]">
                    lic.wandaperrin@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center text-white/60">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-white/70">Instagram</p>
                  <a
                    href="https://www.instagram.com/lic.wandaperrin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-white transition hover:text-[#e3d3b4]"
                  >
                    @lic.wandaperrin
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </>
    </LogoAccentProvider>
  );
}
