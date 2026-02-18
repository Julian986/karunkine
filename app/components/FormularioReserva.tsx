"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const iconPerson = (
  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const iconMail = (
  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
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
  { value: "suelo_pelvico", label: "Disfunción de suelo pélvico" },
  { value: "embarazo", label: "Embarazo" },
  { value: "posparto", label: "Posparto" },
  { value: "lesion", label: "Lesión" },
  { value: "dolor", label: "Dolor" },
  { value: "postura", label: "Postura" },
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
  name,
  ariaLabel,
}: {
  placeholder: string;
  type?: string;
  icon: React.ReactNode;
  id: string;
  name?: string;
  ariaLabel: string;
}) {
  const isTextarea = type === "textarea";
  return (
    <div className="relative">
      {isTextarea ? (
        <textarea
          id={id}
          name={name ?? id}
          placeholder={placeholder}
          rows={3}
          aria-label={ariaLabel}
          className="w-full resize-none rounded-xl bg-zinc-100 py-3 pl-4 pr-11 text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#d4602c]/30"
        />
      ) : (
        <input
          id={id}
          name={name ?? id}
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

  // Cerrar dropdown al hacer scroll en la página
  useEffect(() => {
    if (!motivoOpen) return;
    const handleScroll = () => setMotivoOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [motivoOpen]);

  return (
    <>
      <section
        id="formulario-reserva"
        className="relative z-10 -mt-6 px-4 pb-24 pt-8 sm:px-6 md:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-zinc-800 sm:text-2xl">
                Agendar evaluación
              </h2>
              <p className="mt-1 text-zinc-500">
                Completá tus datos y te contactamos.
              </p>
              <form className="mt-6 flex flex-col gap-5">
                <InputWithIcon
                  id="nombre"
                  name="nombre"
                  placeholder="Nombre y apellido"
                  ariaLabel="Nombre y apellido"
                  icon={iconPerson}
                />
                <InputWithIcon
                  id="mail"
                  name="mail"
                  type="email"
                  placeholder="Mail"
                  ariaLabel="Mail"
                  icon={iconMail}
                />
                <InputWithIcon
                  id="celular"
                  name="celular"
                  placeholder="Celular"
                  ariaLabel="Celular"
                  icon={iconPhone}
                />
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
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
