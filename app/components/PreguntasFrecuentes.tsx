"use client";

import { useState } from "react";
import { BRAND_BG_DARK, altBandBg } from "../lib/brand-colors";
import { useLogoAccent } from "./LogoAccentContext";

const FAQ: { q: string; a: string | string[] }[] = [
  {
    q: "¿Cuánto dura una sesión?",
    a: "Las sesiones regulares grupales tienen una duración estimada de 50'.",
  },
  {
    q: "¿Cuánto dura la evaluación?",
    a: "La consulta inicial de evaluación tiene una duración estimada de 30'.",
  },
  {
    q: "¿Qué tengo que llevar a la evaluación?",
    a: "Ropa cómoda/deportiva y, si se tienen, los estudios médicos.",
  },
  {
    q: "¿Qué tengo que llevar a las sesiones regulares?",
    a: "Ropa cómoda/deportiva, una toalla individual y, opcional, botella o vaso de agua (también se ofrece en el espacio).",
  },
  {
    q: "¿Las clases que no asisto las puedo recuperar?",
    a: [
      "No, las inasistencias no se recuperan. Tampoco en casos de alerta naranja/roja o feriados.",
      "Solo se reprogramarán las clases que se suspendan por motivos personales del profesional.",
    ],
  },
  {
    q: "¿Las clases siempre se realizan sin calzado?",
    a: "Sí, el pie es uno de los principales organizadores de la postura. Estimular adecuadamente los propioceptores plantares es un factor clave en cualquier proceso de recuperación física.",
  },
];

export default function PreguntasFrecuentes() {
  const { accentColor, isLogoV2 } = useLogoAccent();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const sectionBg = altBandBg(isLogoV2);
  const isDarkBand = sectionBg === BRAND_BG_DARK;
  const borderClass = isDarkBand ? "border-white/25 hover:border-white/40" : "border-[#963417]/25 hover:border-[#963417]/40";
  const headingClass = isDarkBand ? "text-white" : "text-[#5c2810]";
  const questionHover = isDarkBand ? "hover:bg-white/10" : "hover:bg-[#963417]/10";
  const questionText = isDarkBand ? "text-white" : "text-[#5c2810]";
  const answerBorder = isDarkBand ? "border-white/20" : "border-[#963417]/15";
  const answerText = isDarkBand ? "text-white/90" : "text-[#6b3014]";

  return (
    <section
      id="preguntas-frecuentes"
      className="px-4 py-14 transition-colors duration-300 sm:px-6 md:px-10"
      style={{ backgroundColor: sectionBg }}
    >
      <div className="mx-auto max-w-2xl">
        <h2 className={`text-2xl font-semibold sm:text-3xl ${headingClass}`}>
          Preguntas frecuentes
        </h2>
        <div className="mt-8 space-y-2">
          {FAQ.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.q}
                className={`overflow-hidden rounded-xl border transition-colors ${borderClass}`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left font-medium transition ${questionHover} ${questionText}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span>{item.q}</span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    style={{ color: accentColor }}
                    aria-hidden
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  aria-hidden={!isOpen}
                  className="grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div
                    className={`min-h-0 overflow-hidden px-5 ${answerText} ${isOpen ? `border-t py-4 ${answerBorder}` : "border-0 py-0"}`}
                  >
                    {Array.isArray(item.a) ? (
                      <div className="space-y-3">
                        {item.a.map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    ) : (
                      <p>{item.a}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
