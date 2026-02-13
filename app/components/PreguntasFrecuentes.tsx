"use client";

import { useState } from "react";

const FAQ = [
  {
    q: "¿Necesito orden médica?",
    a: "Depende del tipo de cobertura y del tratamiento. Te lo indicamos cuando reserves.",
  },
  {
    q: "¿Cuánto dura una sesión?",
    a: "La primera consulta suele ser un poco más larga (evaluación). Las siguientes rondan los 45–60 minutos.",
  },
  {
    q: "¿Qué tengo que llevar?",
    a: "Si tenés estudios o órdenes médicas, traelos. Ropa cómoda ayuda para la evaluación y los ejercicios.",
  },
  {
    q: "¿Con qué frecuencia se recomienda ir?",
    a: "Se define según tu caso en la evaluación. Puede ser 1 o 2 veces por semana al inicio.",
  },
];

export default function PreguntasFrecuentes() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="preguntas-frecuentes" className="bg-white px-4 py-14 sm:px-6 md:px-10">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-semibold text-zinc-800 sm:text-3xl">
          Preguntas frecuentes
        </h2>
        <div className="mt-8 space-y-2">
          {FAQ.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border border-zinc-200 transition-colors hover:border-zinc-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left font-medium text-zinc-800 transition hover:bg-zinc-50"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span>{item.q}</span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#d4602c] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
                  className="grid transition-[grid-template-rows] duration-200 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="border-t border-zinc-100 px-5 py-4 text-zinc-600">{item.a}</p>
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
