"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import DatePicker from "./DatePicker";

const iconPerson = (
  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const iconPhone = (
  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);
const iconChevron = (
  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const MOTIVOS_CONSULTA = [
  { value: "evaluacion", label: "Evaluación / Consulta inicial" },
  { value: "dolor_espalda", label: "Dolor de espalda (cervical, lumbar)" },
  { value: "rehabilitacion", label: "Rehabilitación post lesión o cirugía" },
  { value: "lesion_deportiva", label: "Lesión deportiva" },
  { value: "contracturas", label: "Contracturas / dolor muscular" },
  { value: "kine_respiratoria", label: "Kinesiología respiratoria" },
  { value: "recuperacion_funcional", label: "Recuperación funcional / movilidad" },
  { value: "prevencion", label: "Prevención y mantenimiento" },
  { value: "otro", label: "Otro" },
];

const PLACEHOLDER_MOTIVO = "Motivo de consulta";
const iconSend = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

function InputWithIcon({
  placeholder,
  type = "text",
  icon,
  id,
  ariaLabel,
}: {
  placeholder: string;
  type?: string;
  icon: React.ReactNode;
  id: string;
  ariaLabel: string;
}) {
  const isTextarea = type === "textarea";
  return (
    <div className="relative">
      {isTextarea ? (
        <textarea
          id={id}
          placeholder={placeholder}
          rows={3}
          aria-label={ariaLabel}
          className="w-full resize-none rounded-xl bg-zinc-100 py-3 pl-4 pr-11 text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#d4602c]/30"
        />
      ) : (
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="w-full rounded-xl bg-zinc-100 py-3 pl-4 pr-11 text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#d4602c]/30"
        />
      )}
      <span
        className={`absolute right-3 pointer-events-none ${isTextarea ? "top-3" : "top-1/2 -translate-y-1/2"}`}
      >
        {icon}
      </span>
    </div>
  );
}

export default function FormularioReserva() {
  const [activeTab, setActiveTab] = useState<"reserva" | "info">("reserva");
  const [motivoOpen, setMotivoOpen] = useState(false);
  const [selectedMotivo, setSelectedMotivo] = useState<string>("");
  const [motivoRect, setMotivoRect] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const motivoTriggerRef = useRef<HTMLButtonElement>(null);
  const motivoDropdownRef = useRef<HTMLDivElement>(null);

  const MARGIN = 16;

  const selectedLabel = selectedMotivo
    ? MOTIVOS_CONSULTA.find((m) => m.value === selectedMotivo)?.label ?? PLACEHOLDER_MOTIVO
    : PLACEHOLDER_MOTIVO;

  useEffect(() => {
    if (!motivoOpen || typeof window === "undefined" || !motivoTriggerRef.current) return;
    const rect = motivoTriggerRef.current.getBoundingClientRect();
    const w = Math.min(rect.width, window.innerWidth - MARGIN * 2);
    const left = Math.max(MARGIN, Math.min(rect.left, window.innerWidth - w - MARGIN));
    const top = rect.bottom + 8;
    const maxHeight = Math.min(280, window.innerHeight - top - MARGIN - 24);
    setMotivoRect({ top, left, width: w, maxHeight });
  }, [motivoOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        motivoTriggerRef.current?.contains(target) ||
        motivoDropdownRef.current?.contains(target)
      ) return;
      setMotivoOpen(false);
    }
    if (motivoOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [motivoOpen]);

  return (
    <>
      <section
        id="formulario-reserva"
        className="relative z-10 -mt-6 px-4 pb-24 pt-8 sm:px-6 md:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-2xl">
          {/* Tarjeta flotante estilo referencia */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            {/* Pestañas */}
            <div className="border-b border-zinc-200 px-6 pt-6">
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("reserva")}
                  className={`pb-4 text-sm font-semibold transition ${
                    activeTab === "reserva"
                      ? "border-b-2 border-[#d4602c] text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  Reserva
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("info")}
                  className={`pb-4 text-sm font-semibold transition ${
                    activeTab === "info"
                      ? "border-b-2 border-[#d4602c] text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  Información
                </button>
              </div>
            </div>

            {/* Contenido según pestaña */}
            <div className="p-6 sm:p-8">
              {activeTab === "reserva" && (
                <form className="flex flex-col gap-5">
                  <InputWithIcon
                    id="nombre"
                    placeholder="Tu nombre"
                    ariaLabel="Nombre"
                    icon={iconPerson}
                  />
                  <InputWithIcon
                    id="celular"
                    placeholder="Celular"
                    ariaLabel="Celular"
                    icon={iconPhone}
                  />
                  <DatePicker id="fecha" placeholder="Fecha preferida" ariaLabel="Fecha preferida" />
                  <div className="relative">
                    <input type="hidden" name="motivo" value={selectedMotivo} readOnly />
                    <button
                      ref={motivoTriggerRef}
                      type="button"
                      id="motivo"
                      aria-label="Motivo de consulta"
                      aria-expanded={motivoOpen}
                      onClick={() => setMotivoOpen((o) => !o)}
                      className="flex w-full cursor-pointer items-center rounded-xl bg-zinc-100 py-3 pl-4 pr-11 text-left outline-none transition focus:ring-2 focus:ring-[#d4602c]/30"
                    >
                      <span className={selectedMotivo ? "text-zinc-800" : "text-zinc-400"}>
                        {selectedLabel}
                      </span>
                    </button>
                    <span
                      className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${motivoOpen ? "rotate-180" : ""}`}
                    >
                      {iconChevron}
                    </span>
                  </div>
                  {motivoOpen && motivoRect && typeof document !== "undefined" &&
                    createPortal(
                      <div
                        ref={motivoDropdownRef}
                        className="fixed z-[100] overflow-y-auto rounded-xl border border-zinc-200 bg-white py-2 shadow-[0_10px_40px_rgba(0,0,0,0.12)]"
                        style={{
                          top: motivoRect.top,
                          left: motivoRect.left,
                          width: motivoRect.width,
                          maxHeight: motivoRect.maxHeight,
                        }}
                      >
                        {MOTIVOS_CONSULTA.map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setSelectedMotivo(value);
                              setMotivoOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-sm transition first:mt-0 last:mb-0 ${
                              selectedMotivo === value
                                ? "bg-[#d4602c]/10 font-medium text-[#d4602c]"
                                : "text-zinc-700 hover:bg-zinc-50 hover:text-[#d4602c]"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>,
                      document.body
                    )}
                  <button
                    type="button"
                    className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#d4602c] py-3.5 font-semibold text-white transition hover:opacity-90"
                  >
                    Enviar solicitud
                    {iconSend}
                  </button>
                </form>
              )}
              {activeTab === "info" && (
                <div className="py-4 text-zinc-600">
                  <p className="text-sm leading-relaxed">
                    Acá podés agregar información sobre consultorio, horarios o tratamientos. Por ahora esta pestaña es solo de ejemplo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
