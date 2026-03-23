"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { z } from "zod";
import { hexToRgba, useLogoAccent } from "./LogoAccentContext";

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
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);
const iconCheck = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const MOTIVOS_CONSULTA = [
  { value: "suelo_pelvico", label: "Disfunción de suelo pélvico" },
  { value: "embarazo", label: "Embarazo" },
  { value: "posparto", label: "Posparto" },
  { value: "lesion", label: "Lesión" },
  { value: "dolor", label: "Dolor" },
  { value: "postura", label: "Postura" },
] as const;

const MODALIDAD_OPCIONES = [
  { value: "grupal", label: "Clases grupales" },
  { value: "consulta_individual", label: "Consulta individual" },
] as const;

const HORARIOS_GRUPAL = [
  { value: "grupal_930", label: "Martes y Jueves - 9:30H" },
  { value: "grupal_1030", label: "Martes y Jueves - 10:30H" },
  { value: "grupal_16", label: "Martes y Jueves - 16H" },
  { value: "grupal_17", label: "Martes y Jueves - 17H" },
] as const;

const HORARIOS_INDIVIDUAL = [
  { value: "mie_930", label: "Miércoles - 9:30" },
  { value: "mie_1030", label: "Miércoles - 10:30" },
  { value: "mie_16", label: "Miércoles - 16H" },
  { value: "mie_17", label: "Miércoles - 17H" },
] as const;

const PRECIO_GRUPAL_MENSUAL = 160_000;
const PRECIO_CONSULTA_INDIVIDUAL = 40_000;

const PLACEHOLDER_MOTIVO = "Motivo de consulta";
const PLACEHOLDER_MODALIDAD = "¿Clases grupales o consulta individual?";
const PLACEHOLDER_HORARIO = "Seleccioná un horario";

const MOTIVO_VALUES = new Set<string>(MOTIVOS_CONSULTA.map((o) => o.value));
const HORARIO_GRUPAL_VALUES = new Set<string>(HORARIOS_GRUPAL.map((o) => o.value));
const HORARIO_INDIVIDUAL_VALUES = new Set<string>(HORARIOS_INDIVIDUAL.map((o) => o.value));

const phoneDigits = (value: string) => value.replace(/\D/g, "");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const nombreSchema = z
  .string()
  .trim()
  .min(3, "Ingresá nombre y apellido.")
  .max(80, "El nombre es demasiado largo.");

const mailSchema = z
  .string()
  .trim()
  .min(1, "Ingresá un mail.")
  .regex(emailRegex, "Ingresá un mail válido.");

const celularSchema = z
  .string()
  .trim()
  .min(1, "Ingresá un celular.")
  .refine((value) => /^[+\d\s()-]+$/.test(value), "Usá solo números y símbolos telefónicos.")
  .refine((value) => {
    const digits = phoneDigits(value);
    return digits.length >= 10 && digits.length <= 15;
  }, "Ingresá un celular válido.");

const formularioSchema = z
  .object({
    nombre: nombreSchema,
    mail: mailSchema,
    celular: celularSchema,
    motivo: z.string().min(1, "Elegí un motivo de consulta."),
    modalidad: z.string().trim(),
    horario: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    if (!MOTIVO_VALUES.has(values.motivo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["motivo"],
        message: "Elegí un motivo de consulta válido.",
      });
    }

    if (values.modalidad !== "grupal" && values.modalidad !== "consulta_individual") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["modalidad"],
        message: "Elegí si querés clases grupales o consulta individual.",
      });
      return;
    }

    if (!values.horario) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horario"],
        message: "Elegí un horario.",
      });
      return;
    }

    if (values.modalidad === "grupal" && !HORARIO_GRUPAL_VALUES.has(values.horario)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horario"],
        message: "Elegí un horario grupal válido.",
      });
    }

    if (
      values.modalidad === "consulta_individual" &&
      !HORARIO_INDIVIDUAL_VALUES.has(values.horario)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horario"],
        message: "Elegí un horario válido para consulta individual.",
      });
    }
  });

const iconSend = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

type Option = { value: string; label: string };
type PickerKey = "motivo" | "modalidad" | "horario" | null;
type FormField = "nombre" | "mail" | "celular" | "motivo" | "modalidad" | "horario";
type FormErrors = Partial<Record<FormField, string>>;
type TouchedFields = Partial<Record<FormField, boolean>>;
type DropdownRect = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

const DROPDOWN_MARGIN = 12;
const DROPDOWN_GAP = 6;
const DROPDOWN_MAX_HEIGHT = 420;
const DROPDOWN_MIN_VISIBLE = 220;
const DROPDOWN_ITEM_ESTIMATED_HEIGHT = 48;

function InputWithIcon({
  placeholder,
  type = "text",
  icon,
  id,
  name,
  ariaLabel,
  error,
  onBlur,
}: {
  placeholder: string;
  type?: string;
  icon: React.ReactNode;
  id: string;
  name?: string;
  ariaLabel: string;
  error?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
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
          aria-invalid={Boolean(error)}
          onBlur={onBlur}
          className={`form-accent-focus w-full resize-none rounded-xl bg-zinc-100 py-3 pl-4 pr-11 text-zinc-800 outline-none transition placeholder:text-zinc-400 ${error ? "ring-1 ring-red-400" : ""}`}
        />
      ) : (
        <input
          id={id}
          name={name ?? id}
          type={type}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={Boolean(error)}
          onBlur={onBlur}
          className={`form-accent-focus w-full rounded-xl bg-zinc-100 py-3 pl-4 pr-11 text-zinc-800 outline-none transition placeholder:text-zinc-400 ${error ? "ring-1 ring-red-400" : ""}`}
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

function computeDropdownRect(trigger: HTMLElement | null): DropdownRect | null {
  if (typeof window === "undefined" || !trigger) return null;

  const rect = trigger.getBoundingClientRect();
  const width = Math.min(rect.width, window.innerWidth - DROPDOWN_MARGIN * 2);
  const left = Math.max(
    DROPDOWN_MARGIN,
    Math.min(rect.left, window.innerWidth - width - DROPDOWN_MARGIN)
  );

  const spaceBelow = window.innerHeight - rect.bottom - DROPDOWN_MARGIN;

  const maxHeight = Math.max(
    120,
    Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow - DROPDOWN_GAP)
  );

  const top = rect.bottom + DROPDOWN_GAP;

  return { top, left, width, maxHeight };
}

function CustomPickerField({
  id,
  ariaLabel,
  placeholder,
  value,
  options,
  isOpen,
  triggerRef,
  dropdownRef,
  rect,
  onToggle,
  onSelect,
  accentColor,
  error,
}: {
  id: string;
  ariaLabel: string;
  placeholder: string;
  value: string;
  options: readonly Option[];
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  rect: DropdownRect | null;
  onToggle: () => void;
  onSelect: (value: string) => void;
  accentColor: string;
  error?: string;
}) {
  const selected = options.find((o) => o.value === value);
  const accentSoftBg = hexToRgba(accentColor, 0.14);

  return (
    <>
      <div className="relative w-full min-w-0">
        <button
          ref={triggerRef}
          type="button"
          id={id}
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-invalid={Boolean(error)}
          onClick={onToggle}
          className={`form-accent-focus group flex h-[48px] w-full min-w-0 items-center rounded-xl border bg-white px-4 pr-11 text-left shadow-[0_1px_0_rgba(0,0,0,0.03)] transition ${
            error ? "border-red-400" : "border-zinc-200 hover:border-zinc-300"
          }`}
        >
          <span className={`block min-w-0 flex-1 truncate text-[15px] ${selected ? "text-zinc-800" : "text-zinc-500"}`}>
            {selected?.label ?? placeholder}
          </span>
          <span
            className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            {iconChevron}
          </span>
        </button>
      </div>

      {isOpen && rect && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[120] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              maxHeight: rect.maxHeight,
              transformOrigin: "top",
            }}
          >
            <div className="max-h-full overflow-y-auto p-1.5 pb-3">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onSelect(option.value)}
                    className="relative flex w-full items-center rounded-lg px-3.5 py-3 text-left text-base text-zinc-700 transition hover:bg-zinc-50"
                    style={isSelected ? { backgroundColor: accentSoftBg, color: accentColor } : undefined}
                  >
                    <span className="block min-w-0 flex-1 truncate pr-6 leading-6">{option.label}</span>
                    <span
                      className="pointer-events-none absolute right-2.5 flex h-5 w-5 items-center justify-center"
                      style={{ opacity: isSelected ? 1 : 0, color: accentColor }}
                      aria-hidden
                    >
                      {iconCheck}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default function FormularioReserva() {
  const { accentColor } = useLogoAccent();
  const focusRingColor = hexToRgba(accentColor, 0.35);

  const [selectedMotivo, setSelectedMotivo] = useState("");
  const [selectedModalidad, setSelectedModalidad] = useState<"" | "grupal" | "consulta_individual">("");
  const [selectedHorario, setSelectedHorario] = useState("");

  const [openPicker, setOpenPicker] = useState<PickerKey>(null);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [envioError, setEnvioError] = useState<string | null>(null);
  const [envioOk, setEnvioOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const motivoTriggerRef = useRef<HTMLButtonElement>(null);
  const modalidadTriggerRef = useRef<HTMLButtonElement>(null);
  const horarioTriggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const didAutoScrollRef = useRef(false);

  const clearFieldError = useCallback((field: FormField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const markTouched = useCallback((field: FormField) => {
    setTouchedFields((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  const shouldShowError = useCallback(
    (field: FormField) => Boolean(fieldErrors[field] && (submitAttempted || touchedFields[field])),
    [fieldErrors, submitAttempted, touchedFields]
  );

  const validateTextField = useCallback((field: "nombre" | "mail" | "celular", value: string) => {
    const schema =
      field === "nombre" ? nombreSchema : field === "mail" ? mailSchema : celularSchema;
    const result = schema.safeParse(value);

    setFieldErrors((prev) => {
      const next = { ...prev };
      if (result.success) {
        delete next[field];
      } else {
        next[field] = result.error.issues[0]?.message ?? "Campo inválido.";
      }
      return next;
    });
  }, []);

  const opcionesHorarioActual = useMemo(() => {
    if (selectedModalidad === "grupal") return HORARIOS_GRUPAL;
    if (selectedModalidad === "consulta_individual") return HORARIOS_INDIVIDUAL;
    return [];
  }, [selectedModalidad]);

  const esGrupal = selectedModalidad === "grupal";
  const turnoCompleto = Boolean(selectedModalidad && selectedHorario);

  const resumenPrecio = useMemo(() => {
    if (!turnoCompleto) return null;
    if (esGrupal) {
      return {
        monto: PRECIO_GRUPAL_MENSUAL,
        descripcion: "Plan mensual - clases grupales (referencia)",
      };
    }
    return {
      monto: PRECIO_CONSULTA_INDIVIDUAL,
      descripcion: "Consulta individual (referencia)",
    };
  }, [turnoCompleto, esGrupal]);

  const modalidadHidden = useMemo(() => {
    if (!turnoCompleto) return "";
    return selectedModalidad;
  }, [turnoCompleto, selectedModalidad]);

  const turnoDetalleHidden = useMemo(() => {
    if (!selectedHorario) return "";
    return opcionesHorarioActual.find((t) => t.value === selectedHorario)?.label ?? "";
  }, [selectedHorario, opcionesHorarioActual]);

  const precioReferenciaHidden = useMemo(() => {
    if (!turnoCompleto) return "";
    return esGrupal ? String(PRECIO_GRUPAL_MENSUAL) : String(PRECIO_CONSULTA_INDIVIDUAL);
  }, [turnoCompleto, esGrupal]);

  const activeTrigger = useMemo(() => {
    if (openPicker === "motivo") return motivoTriggerRef.current;
    if (openPicker === "modalidad") return modalidadTriggerRef.current;
    if (openPicker === "horario") return horarioTriggerRef.current;
    return null;
  }, [openPicker]);

  const updateDropdownPosition = useCallback(() => {
    if (!activeTrigger) {
      setDropdownRect(null);
      return;
    }
    setDropdownRect(computeDropdownRect(activeTrigger));
  }, [activeTrigger]);

  const desiredVisibleHeight = useMemo(() => {
    const count =
      openPicker === "motivo"
        ? MOTIVOS_CONSULTA.length
        : openPicker === "modalidad"
          ? MODALIDAD_OPCIONES.length
          : openPicker === "horario"
            ? opcionesHorarioActual.length
            : 0;

    const estimated = count * DROPDOWN_ITEM_ESTIMATED_HEIGHT + 28;
    return Math.min(
      DROPDOWN_MAX_HEIGHT,
      Math.max(DROPDOWN_MIN_VISIBLE, estimated)
    );
  }, [openPicker, opcionesHorarioActual.length]);

  useEffect(() => {
    if (!openPicker) {
      setDropdownRect(null);
      return;
    }
    didAutoScrollRef.current = false;

    if (activeTrigger && !didAutoScrollRef.current) {
      const rect = activeTrigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - DROPDOWN_MARGIN;
      const desiredVisible = desiredVisibleHeight;

      if (spaceBelow < desiredVisible) {
        const delta = desiredVisible - spaceBelow + 12;
        didAutoScrollRef.current = true;
        window.scrollBy({ top: delta, behavior: "smooth" });
        window.setTimeout(() => {
          updateDropdownPosition();
        }, 280);
      }
    }

    updateDropdownPosition();

    const handleViewportChange = () => {
      updateDropdownPosition();
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [openPicker, activeTrigger, desiredVisibleHeight, updateDropdownPosition]);

  useEffect(() => {
    if (!openPicker) return;

    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      const insideDropdown = dropdownRef.current?.contains(target);
      const insideTrigger =
        motivoTriggerRef.current?.contains(target) ||
        modalidadTriggerRef.current?.contains(target) ||
        horarioTriggerRef.current?.contains(target);

      if (!insideDropdown && !insideTrigger) {
        setOpenPicker(null);
      }
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenPicker(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [openPicker]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnvioError(null);
    setEnvioOk(false);
    setSubmitAttempted(true);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const result = formularioSchema.safeParse({
      nombre: String(formData.get("nombre") ?? ""),
      mail: String(formData.get("mail") ?? ""),
      celular: String(formData.get("celular") ?? ""),
      motivo: selectedMotivo,
      modalidad: selectedModalidad,
      horario: selectedHorario,
    });

    if (!result.success) {
      const nextErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && !nextErrors[path as FormField]) {
          nextErrors[path as FormField] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setEnvioError("Revisá los campos marcados.");
      return;
    }

    const payload = {
      nombre: result.data.nombre,
      mail: result.data.mail,
      celular: result.data.celular,
      motivo: selectedMotivo,
      modalidad: selectedModalidad,
      horario: selectedHorario,
      turnoDetalle: turnoDetalleHidden,
      turnoCodigo:
        selectedModalidad && selectedHorario ? `${selectedModalidad}|${selectedHorario}` : "",
      precioReferenciaArs: Number(precioReferenciaHidden || 0),
    };

    setSubmitting(true);
    try {
      const response = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setEnvioError("No pudimos enviar la solicitud. Intentá nuevamente.");
        return;
      }
    } catch {
      setEnvioError("No pudimos enviar la solicitud. Verificá tu conexión.");
      return;
    } finally {
      setSubmitting(false);
    }

    setSubmitAttempted(false);
    setEnvioOk(true);
    setSelectedMotivo("");
    setSelectedModalidad("");
    setSelectedHorario("");
    setTouchedFields({});
  }

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

              <form
                className="mt-6 flex flex-col gap-5"
                style={{ ["--form-focus-ring" as string]: focusRingColor } as React.CSSProperties}
                noValidate
                onInput={(e) => {
                  const target = e.target as HTMLInputElement | HTMLTextAreaElement;
                  const name = target.name as FormField;
                  if (name === "nombre" || name === "mail" || name === "celular") {
                    if (submitAttempted || touchedFields[name]) {
                      validateTextField(name, target.value);
                    }
                  }
                }}
                onSubmit={handleSubmit}
              >
                <input type="hidden" name="modalidad" value={modalidadHidden} readOnly />
                <input type="hidden" name="turno_detalle" value={turnoDetalleHidden} readOnly />
                <input type="hidden" name="precio_referencia_ars" value={precioReferenciaHidden} readOnly />

                <div className="space-y-1.5">
                  <InputWithIcon
                    id="nombre"
                    name="nombre"
                    placeholder="Nombre y apellido"
                    ariaLabel="Nombre y apellido"
                    icon={iconPerson}
                    error={shouldShowError("nombre") ? fieldErrors.nombre : undefined}
                    onBlur={(e) => {
                      markTouched("nombre");
                      validateTextField("nombre", e.currentTarget.value);
                    }}
                  />
                  {shouldShowError("nombre") && fieldErrors.nombre && (
                    <p className="px-1 text-sm font-medium text-red-600" role="alert">
                      {fieldErrors.nombre}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <InputWithIcon
                    id="mail"
                    name="mail"
                    type="email"
                    placeholder="Mail"
                    ariaLabel="Mail"
                    icon={iconMail}
                    error={shouldShowError("mail") ? fieldErrors.mail : undefined}
                    onBlur={(e) => {
                      markTouched("mail");
                      validateTextField("mail", e.currentTarget.value);
                    }}
                  />
                  {shouldShowError("mail") && fieldErrors.mail && (
                    <p className="px-1 text-sm font-medium text-red-600" role="alert">
                      {fieldErrors.mail}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <InputWithIcon
                    id="celular"
                    name="celular"
                    placeholder="Celular"
                    ariaLabel="Celular"
                    icon={iconPhone}
                    error={shouldShowError("celular") ? fieldErrors.celular : undefined}
                    onBlur={(e) => {
                      markTouched("celular");
                      validateTextField("celular", e.currentTarget.value);
                    }}
                  />
                  {shouldShowError("celular") && fieldErrors.celular && (
                    <p className="px-1 text-sm font-medium text-red-600" role="alert">
                      {fieldErrors.celular}
                    </p>
                  )}
                </div>

                <input type="hidden" name="motivo" value={selectedMotivo} readOnly />
                <CustomPickerField
                  id="motivo"
                  ariaLabel="Motivo de consulta"
                  placeholder={PLACEHOLDER_MOTIVO}
                  value={selectedMotivo}
                  options={MOTIVOS_CONSULTA}
                  isOpen={openPicker === "motivo"}
                  triggerRef={motivoTriggerRef}
                  dropdownRef={dropdownRef}
                  rect={dropdownRect}
                  onToggle={() => setOpenPicker((p) => (p === "motivo" ? null : "motivo"))}
                  onSelect={(value) => {
                    setSelectedMotivo(value);
                    clearFieldError("motivo");
                    setOpenPicker(null);
                  }}
                  accentColor={accentColor}
                  error={shouldShowError("motivo") ? fieldErrors.motivo : undefined}
                />
                {shouldShowError("motivo") && fieldErrors.motivo && (
                  <p className="-mt-3 px-1 text-sm font-medium text-red-600" role="alert">
                    {fieldErrors.motivo}
                  </p>
                )}

                <input
                  type="hidden"
                  name="turno_codigo"
                  value={selectedModalidad && selectedHorario ? `${selectedModalidad}|${selectedHorario}` : ""}
                  readOnly
                />
                <CustomPickerField
                  id="modalidad_turno"
                  ariaLabel="Clases grupales o consulta individual"
                  placeholder={PLACEHOLDER_MODALIDAD}
                  value={selectedModalidad}
                  options={MODALIDAD_OPCIONES}
                  isOpen={openPicker === "modalidad"}
                  triggerRef={modalidadTriggerRef}
                  dropdownRef={dropdownRef}
                  rect={dropdownRect}
                  onToggle={() => setOpenPicker((p) => (p === "modalidad" ? null : "modalidad"))}
                  onSelect={(value) => {
                    setSelectedModalidad(value as "" | "grupal" | "consulta_individual");
                    setSelectedHorario("");
                    clearFieldError("modalidad");
                    clearFieldError("horario");
                    setOpenPicker(null);
                  }}
                  accentColor={accentColor}
                  error={shouldShowError("modalidad") ? fieldErrors.modalidad : undefined}
                />
                {shouldShowError("modalidad") && fieldErrors.modalidad && (
                  <p className="-mt-3 px-1 text-sm font-medium text-red-600" role="alert">
                    {fieldErrors.modalidad}
                  </p>
                )}

                {selectedModalidad !== "" && (
                  <CustomPickerField
                    id="horario"
                    ariaLabel={
                      esGrupal
                        ? "Horario clases grupales martes y jueves"
                        : "Horario consulta individual miércoles"
                    }
                    placeholder={PLACEHOLDER_HORARIO}
                    value={selectedHorario}
                    options={opcionesHorarioActual}
                    isOpen={openPicker === "horario"}
                    triggerRef={horarioTriggerRef}
                    dropdownRef={dropdownRef}
                    rect={dropdownRect}
                    onToggle={() => setOpenPicker((p) => (p === "horario" ? null : "horario"))}
                    onSelect={(value) => {
                      setSelectedHorario(value);
                      clearFieldError("horario");
                      setOpenPicker(null);
                    }}
                    accentColor={accentColor}
                    error={shouldShowError("horario") ? fieldErrors.horario : undefined}
                  />
                )}
                {shouldShowError("horario") && fieldErrors.horario && (
                  <p className="-mt-3 px-1 text-sm font-medium text-red-600" role="alert">
                    {fieldErrors.horario}
                  </p>
                )}

                {resumenPrecio && (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                    <p className="font-medium text-zinc-800">Importe de referencia</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                      ${resumenPrecio.monto.toLocaleString("es-AR")}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">{resumenPrecio.descripcion}</p>
                  </div>
                )}

                {envioError && (
                  <p className="text-sm font-medium text-red-600" role="alert">
                    {envioError}
                  </p>
                )}
                {envioOk && (
                  <p className="text-sm font-medium text-emerald-700" role="status">
                    ¡Gracias! Recibimos tu solicitud y te contactaremos pronto.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ backgroundColor: accentColor }}
                >
                  {submitting ? "Enviando..." : "Enviar solicitud"}
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
