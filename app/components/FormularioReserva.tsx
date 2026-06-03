"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { z } from "zod";
import { event as gaEvent } from "../../lib/gtag";
import { hexToRgba, useLogoAccent } from "./LogoAccentContext";
import { MercadoPagoButton } from "./MercadoPagoButton";
import { iconMail, iconPerson, iconPhone, ReservaFormInput } from "./ReservaFormInput";
import { ReservaHuecosCalendario, type HuecoSeleccionado } from "./ReservaHuecosCalendario";

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
  { value: "grupal_15", label: "Martes y Jueves - 15:00H" },
  { value: "grupal_16", label: "Martes y Jueves - 16H" },
  { value: "grupal_17", label: "Martes y Jueves - 17H" },
] as const;

const HORARIOS_INDIVIDUAL = [
  { value: "lun_1400", label: "Lunes 14:00H" },
  { value: "lun_1500", label: "Lunes 15:00H" },
  { value: "mar_930", label: "Martes 9:30H" },
  { value: "mie_1400", label: "Miércoles 14:00H" },
  { value: "mie_1500", label: "Miércoles 15:00H" },
  { value: "mie_1600", label: "Miércoles 16:00H" },
  { value: "jue_930", label: "Jueves 9:30H" },
] as const;

const FORMATO_CONSULTA_OPCIONES = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
] as const;

/** Precios finales que ve y paga el cliente en checkout; la comisión de Mercado Pago la absorbe la cuenta de la profesional. */
const PRECIO_GRUPAL_MENSUAL = 160_000;
const PRECIO_CONSULTA_INDIVIDUAL = 40_000;

const PLACEHOLDER_MOTIVO = "Motivo de consulta";
const PLACEHOLDER_MODALIDAD = "¿Clases grupales o consulta individual?";
const PLACEHOLDER_HORARIO = "Horario de clases grupales (martes y jueves)";
const PLACEHOLDER_FORMATO_CONSULTA = "Consulta presencial o virtual";
const PLACEHOLDER_EVAL_FORMATO = "Evaluación: presencial o virtual";

const MOTIVO_VALUES = new Set<string>(MOTIVOS_CONSULTA.map((o) => o.value));
const HORARIO_GRUPAL_VALUES = new Set<string>(HORARIOS_GRUPAL.map((o) => o.value));
const HORARIO_INDIVIDUAL_VALUES = new Set<string>(HORARIOS_INDIVIDUAL.map((o) => o.value));
const FORMATO_CONSULTA_VALUES = new Set<string>(
  FORMATO_CONSULTA_OPCIONES.map((o) => o.value)
);

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
    formatoConsulta: z.string().trim(),
    horario: z.string().trim(),
    horarioEvaluacion: z.string().trim(),
    formatoEvaluacion: z.string().trim(),
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

    if (values.modalidad === "consulta_individual") {
      if (!FORMATO_CONSULTA_VALUES.has(values.formatoConsulta)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["formatoConsulta"],
          message: "Elegí si la consulta es presencial o virtual.",
        });
      }
      if (values.horarioEvaluacion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["horarioEvaluacion"],
          message: "Este campo solo aplica a clases grupales.",
        });
      }
      if (values.formatoEvaluacion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["formatoEvaluacion"],
          message: "Este campo solo aplica a clases grupales.",
        });
      }
    }

    if (values.modalidad === "grupal") {
      if (!values.horarioEvaluacion || !HORARIO_INDIVIDUAL_VALUES.has(values.horarioEvaluacion)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["horarioEvaluacion"],
          message: "Elegí horario para la evaluación inicial.",
        });
      }
      if (!FORMATO_CONSULTA_VALUES.has(values.formatoEvaluacion)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["formatoEvaluacion"],
          message: "Elegí si la evaluación es presencial o virtual.",
        });
      }
    }
  });

type Option = { value: string; label: string };
type PickerKey =
  | "motivo"
  | "modalidad"
  | "formatoConsulta"
  | "horario"
  | "formatoEvaluacion"
  | null;
type FormField =
  | "nombre"
  | "mail"
  | "celular"
  | "motivo"
  | "modalidad"
  | "formatoConsulta"
  | "horario"
  | "horarioEvaluacion"
  | "formatoEvaluacion";
type FormErrors = Partial<Record<FormField, string>>;
type TouchedFields = Partial<Record<FormField, boolean>>;
type ReservaDraft = {
  nombre: string;
  mail: string;
  celular: string;
  motivo: string;
  modalidad: "" | "grupal" | "consulta_individual";
  formatoConsulta: "" | "presencial" | "virtual";
  horario: string;
  horarioEvaluacion: string;
  formatoEvaluacion: "" | "presencial" | "virtual";
  principalSlotJson?: string;
  evalSlotJson?: string;
};
type DropdownRect = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};
const DRAFT_STORAGE_KEY = "karunkine_reserva_draft_v3";
const PENDING_RESERVA_ID_KEY = "karunkine_pending_reserva_id";

const DROPDOWN_MARGIN = 12;
const DROPDOWN_GAP = 6;
const DROPDOWN_MAX_HEIGHT = 420;
const DROPDOWN_MIN_VISIBLE = 220;
const DROPDOWN_ITEM_ESTIMATED_HEIGHT = 48;

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
  disabled = false,
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
  disabled?: boolean;
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
          disabled={disabled}
          onClick={() => {
            if (!disabled) onToggle();
          }}
          className={`form-accent-focus group flex h-[48px] w-full min-w-0 items-center rounded-xl border bg-white px-4 pr-11 text-left shadow-[0_1px_0_rgba(0,0,0,0.03)] transition ${
            error ? "border-red-400" : "border-zinc-200 hover:border-zinc-300"
          } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
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
  const [selectedFormatoConsulta, setSelectedFormatoConsulta] = useState<
    "" | "presencial" | "virtual"
  >("");
  const [selectedHorario, setSelectedHorario] = useState("");
  const [selectedHorarioEvaluacion, setSelectedHorarioEvaluacion] = useState("");
  const [selectedFormatoEvaluacion, setSelectedFormatoEvaluacion] = useState<
    "" | "presencial" | "virtual"
  >("");
  const [huecoIndividual, setHuecoIndividual] = useState<HuecoSeleccionado | null>(null);
  const [huecoEvalGrupal, setHuecoEvalGrupal] = useState<HuecoSeleccionado | null>(null);

  const [openPicker, setOpenPicker] = useState<PickerKey>(null);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [envioError, setEnvioError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const [horariosGrupalDisponibles, setHorariosGrupalDisponibles] = useState<string[] | null>(null);
  const [horariosGrupalLoading, setHorariosGrupalLoading] = useState(false);

  const motivoTriggerRef = useRef<HTMLButtonElement>(null);
  const modalidadTriggerRef = useRef<HTMLButtonElement>(null);
  const formatoConsultaTriggerRef = useRef<HTMLButtonElement>(null);
  const horarioTriggerRef = useRef<HTMLButtonElement>(null);
  const formatoEvaluacionTriggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const didAutoScrollRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const pagoYEnvioRef = useRef<HTMLDivElement>(null);
  const scrollSuaveTrasElegirHorarioRef = useRef(false);
  const calendarioIndividualRef = useRef<HTMLDivElement>(null);
  const calendarioEvalGrupalRef = useRef<HTMLDivElement>(null);

  const scrollSuaveHaciaCalendario = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      });
    });
  }, []);

  /** Tras pintar el calendario (el ref no existe en el mismo tick que setState). */
  const scrollAlCalendarioTrasPintar = useCallback(
    (ref: RefObject<HTMLDivElement | null>) => {
      window.setTimeout(() => {
        const el = ref.current;
        if (el) {
          scrollSuaveHaciaCalendario(el);
        } else {
          window.setTimeout(() => scrollSuaveHaciaCalendario(ref.current), 32);
        }
      }, 0);
    },
    [scrollSuaveHaciaCalendario],
  );

  const persistDraft = useCallback((draft: ReservaDraft) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, []);

  const getCurrentDraft = useCallback((): ReservaDraft => {
    const form = formRef.current;
    const nombreInput = form?.elements.namedItem("nombre") as HTMLInputElement | null;
    const mailInput = form?.elements.namedItem("mail") as HTMLInputElement | null;
    const celularInput = form?.elements.namedItem("celular") as HTMLInputElement | null;
    return {
      nombre: nombreInput?.value ?? "",
      mail: mailInput?.value ?? "",
      celular: celularInput?.value ?? "",
      motivo: selectedMotivo,
      modalidad: selectedModalidad,
      formatoConsulta: selectedFormatoConsulta,
      horario: selectedHorario,
      horarioEvaluacion: selectedHorarioEvaluacion,
      formatoEvaluacion: selectedFormatoEvaluacion,
      principalSlotJson: huecoIndividual
        ? JSON.stringify({
            dateKey: huecoIndividual.dateKey,
            timeLocal: huecoIndividual.timeLocal,
            templateId: huecoIndividual.templateId,
            etiqueta: huecoIndividual.etiqueta,
          })
        : undefined,
      evalSlotJson: huecoEvalGrupal
        ? JSON.stringify({
            dateKey: huecoEvalGrupal.dateKey,
            timeLocal: huecoEvalGrupal.timeLocal,
            templateId: huecoEvalGrupal.templateId,
            etiqueta: huecoEvalGrupal.etiqueta,
          })
        : undefined,
    };
  }, [
    selectedMotivo,
    selectedModalidad,
    selectedFormatoConsulta,
    selectedHorario,
    selectedHorarioEvaluacion,
    selectedFormatoEvaluacion,
    huecoIndividual,
    huecoEvalGrupal,
  ]);

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

  const opcionesHorarioPrincipal = useMemo(() => {
    if (selectedModalidad !== "grupal") return [];
    if (!horariosGrupalDisponibles) return [];
    const enabled = new Set(horariosGrupalDisponibles);
    return HORARIOS_GRUPAL.filter((o) => enabled.has(o.value));
  }, [selectedModalidad, horariosGrupalDisponibles]);

  const esGrupal = selectedModalidad === "grupal";
  const esIndividual = selectedModalidad === "consulta_individual";
  const individualListo =
    esIndividual &&
    Boolean(huecoIndividual) &&
    (selectedFormatoConsulta === "presencial" || selectedFormatoConsulta === "virtual");
  const grupalListo =
    esGrupal &&
    Boolean(selectedHorario) &&
    Boolean(huecoEvalGrupal) &&
    (selectedFormatoEvaluacion === "presencial" || selectedFormatoEvaluacion === "virtual");
  const turnoCompleto = Boolean(individualListo || grupalListo);

  const resumenPrecio = useMemo(() => {
    if (!turnoCompleto) return null;
    if (esGrupal) {
      return {
        monto: PRECIO_GRUPAL_MENSUAL,
        descripcion: "Plan mensual: clases grupales + evaluación individual (referencia)",
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
    if (esIndividual && huecoIndividual) {
      const formatoTxt =
        selectedFormatoConsulta === "virtual" ? "virtual" : "presencial";
      return `Consulta individual: ${huecoIndividual.etiqueta} (${formatoTxt})`;
    }
    if (esGrupal && selectedHorario) {
      const grupalLabel =
        HORARIOS_GRUPAL.find((t) => t.value === selectedHorario)?.label ?? "";
      if (!huecoEvalGrupal || !selectedFormatoEvaluacion) return grupalLabel;
      const formatoTxt =
        selectedFormatoEvaluacion === "virtual" ? "virtual" : "presencial";
      return `Clases grupales: ${grupalLabel} · Evaluación: ${huecoEvalGrupal.etiqueta} (${formatoTxt})`;
    }
    return "";
  }, [
    esIndividual,
    esGrupal,
    huecoIndividual,
    huecoEvalGrupal,
    selectedHorario,
    selectedFormatoConsulta,
    selectedFormatoEvaluacion,
  ]);

  const turnoCodigoHidden = useMemo(() => {
    if (!selectedModalidad) return "";
    if (selectedModalidad === "consulta_individual" && huecoIndividual) {
      return `${selectedModalidad}|${huecoIndividual.templateId}|${huecoIndividual.dateKey}|${huecoIndividual.timeLocal}`;
    }
    if (
      selectedModalidad === "grupal" &&
      selectedHorario &&
      huecoEvalGrupal &&
      (selectedFormatoEvaluacion === "presencial" || selectedFormatoEvaluacion === "virtual")
    ) {
      return `grupal|${selectedHorario}|eval:${huecoEvalGrupal.templateId}|${huecoEvalGrupal.dateKey}|${huecoEvalGrupal.timeLocal}|${selectedFormatoEvaluacion}`;
    }
    return "";
  }, [
    selectedModalidad,
    selectedHorario,
    huecoIndividual,
    huecoEvalGrupal,
    selectedFormatoEvaluacion,
  ]);

  const precioReferenciaHidden = useMemo(() => {
    if (!turnoCompleto) return "";
    return esGrupal ? String(PRECIO_GRUPAL_MENSUAL) : String(PRECIO_CONSULTA_INDIVIDUAL);
  }, [turnoCompleto, esGrupal]);

  const activeTrigger = useMemo(() => {
    if (openPicker === "motivo") return motivoTriggerRef.current;
    if (openPicker === "modalidad") return modalidadTriggerRef.current;
    if (openPicker === "formatoConsulta") return formatoConsultaTriggerRef.current;
    if (openPicker === "horario") return horarioTriggerRef.current;
    if (openPicker === "formatoEvaluacion") return formatoEvaluacionTriggerRef.current;
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
          : openPicker === "formatoConsulta" || openPicker === "formatoEvaluacion"
            ? FORMATO_CONSULTA_OPCIONES.length
            : openPicker === "horario"
              ? opcionesHorarioPrincipal.length
              : 0;

    const estimated = count * DROPDOWN_ITEM_ESTIMATED_HEIGHT + 28;
    return Math.min(
      DROPDOWN_MAX_HEIGHT,
      Math.max(DROPDOWN_MIN_VISIBLE, estimated)
    );
  }, [openPicker, opcionesHorarioPrincipal.length]);

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
        formatoConsultaTriggerRef.current?.contains(target) ||
        horarioTriggerRef.current?.contains(target) ||
        formatoEvaluacionTriggerRef.current?.contains(target);

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

  useEffect(() => {
    if (!scrollSuaveTrasElegirHorarioRef.current || !turnoCompleto) return;

    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollSuaveTrasElegirHorarioRef.current = false;
        pagoYEnvioRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      });
    });

    return () => window.cancelAnimationFrame(id);
  }, [turnoCompleto, selectedHorario, huecoIndividual, huecoEvalGrupal]);

  useEffect(() => {
    if (selectedModalidad !== "grupal") {
      setHorariosGrupalDisponibles(null);
      setHorariosGrupalLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      setHorariosGrupalLoading(true);
      try {
        const res = await fetch("/api/reservas/disponibilidad/grupal-horarios", { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as { horarios?: string[] };
        if (!alive) return;
        const horarios = Array.isArray(json.horarios)
          ? json.horarios.filter((h): h is string => typeof h === "string")
          : [];
        setHorariosGrupalDisponibles(horarios);
        if (selectedHorario && !horarios.includes(selectedHorario)) {
          setSelectedHorario("");
          setSelectedHorarioEvaluacion("");
          setSelectedFormatoEvaluacion("");
          setHuecoEvalGrupal(null);
        }
      } catch {
        if (!alive) return;
        setHorariosGrupalDisponibles([]);
      } finally {
        if (alive) setHorariosGrupalLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedModalidad]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as ReservaDraft;
      setSelectedMotivo(draft.motivo ?? "");
      setSelectedModalidad(draft.modalidad ?? "");
      setSelectedFormatoConsulta(draft.formatoConsulta ?? "");
      setSelectedHorario(draft.horario ?? "");
      setSelectedHorarioEvaluacion(draft.horarioEvaluacion ?? "");
      setSelectedFormatoEvaluacion(
        draft.formatoEvaluacion === "presencial" || draft.formatoEvaluacion === "virtual"
          ? draft.formatoEvaluacion
          : ""
      );
      if (draft.principalSlotJson) {
        try {
          const p = JSON.parse(draft.principalSlotJson) as Partial<HuecoSeleccionado>;
          if (p.dateKey && p.timeLocal && p.templateId && p.etiqueta) {
            setHuecoIndividual(p as HuecoSeleccionado);
          }
        } catch {
          /* ignore */
        }
      } else {
        setHuecoIndividual(null);
      }
      if (draft.evalSlotJson) {
        try {
          const p = JSON.parse(draft.evalSlotJson) as Partial<HuecoSeleccionado>;
          if (p.dateKey && p.timeLocal && p.templateId && p.etiqueta) {
            setHuecoEvalGrupal(p as HuecoSeleccionado);
          }
        } catch {
          /* ignore */
        }
      } else {
        setHuecoEvalGrupal(null);
      }
      window.setTimeout(() => {
        const form = formRef.current;
        if (!form) return;
        const nombreInput = form.elements.namedItem("nombre") as HTMLInputElement | null;
        const mailInput = form.elements.namedItem("mail") as HTMLInputElement | null;
        const celularInput = form.elements.namedItem("celular") as HTMLInputElement | null;
        if (nombreInput) nombreInput.value = draft.nombre ?? "";
        if (mailInput) mailInput.value = draft.mail ?? "";
        if (celularInput) celularInput.value = draft.celular ?? "";
      }, 0);
    } catch {
      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  async function iniciarCheckoutMercadoPago() {
    setEnvioError(null);
    setPagoError(null);
    setSubmitAttempted(true);
    setFieldErrors({});

    if (!turnoCompleto || !resumenPrecio) {
      setPagoError(
        esIndividual
          ? "Seleccioná modalidad de consulta (presencial/virtual), fecha y horario en el calendario."
          : "Seleccioná horario de clases grupales, formato y fecha/hora de la evaluación en el calendario."
      );
      return;
    }

    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const result = formularioSchema.safeParse({
      nombre: String(formData.get("nombre") ?? ""),
      mail: String(formData.get("mail") ?? ""),
      celular: String(formData.get("celular") ?? ""),
      motivo: selectedMotivo,
      modalidad: selectedModalidad,
      formatoConsulta: selectedFormatoConsulta,
      horario: selectedHorario,
      horarioEvaluacion: selectedModalidad === "grupal" ? selectedHorarioEvaluacion : "",
      formatoEvaluacion: selectedModalidad === "grupal" ? selectedFormatoEvaluacion : "",
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
      ...(selectedModalidad === "consulta_individual" && selectedFormatoConsulta
        ? { formatoConsulta: selectedFormatoConsulta }
        : {}),
      ...(selectedModalidad === "consulta_individual" && huecoIndividual
        ? {
            principalSlot: {
              dateKey: huecoIndividual.dateKey,
              timeLocal: huecoIndividual.timeLocal,
            },
          }
        : {}),
      ...(selectedModalidad === "grupal" &&
      huecoEvalGrupal &&
      selectedHorarioEvaluacion &&
      (selectedFormatoEvaluacion === "presencial" || selectedFormatoEvaluacion === "virtual")
        ? {
            horarioEvaluacion: selectedHorarioEvaluacion,
            formatoEvaluacion: selectedFormatoEvaluacion,
            evalSlot: {
              dateKey: huecoEvalGrupal.dateKey,
              timeLocal: huecoEvalGrupal.timeLocal,
            },
          }
        : {}),
      turnoDetalle: turnoDetalleHidden,
      turnoCodigo: turnoCodigoHidden,
      precioReferenciaArs: Math.round(Number(precioReferenciaHidden || 0)),
    };

    setCheckoutLoading(true);
    try {
      const resPendiente = await fetch("/api/reservas/pendiente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const jsonP = (await resPendiente.json().catch(() => ({}))) as {
        error?: string;
        id?: string;
      };
      if (!resPendiente.ok) {
        setPagoError(jsonP.error ?? "No se pudo iniciar la reserva.");
        return;
      }
      const id = jsonP.id;
      if (!id) {
        setPagoError("Respuesta inválida del servidor.");
        return;
      }

      const resPref = await fetch(`/api/reservas/${id}/preferencia`, {
        method: "POST",
      });
      const jsonPref = (await resPref.json().catch(() => ({}))) as {
        error?: string;
        initPoint?: string;
      };
      if (!resPref.ok) {
        setPagoError(jsonPref.error ?? "No se pudo crear el checkout de Mercado Pago.");
        return;
      }
      const initPoint = jsonPref.initPoint;
      if (!initPoint || typeof window === "undefined") {
        setPagoError("No se obtuvo el enlace de pago.");
        return;
      }

      gaEvent("reserva_checkout_mercadopago", {
        modalidad: selectedModalidad,
        value: resumenPrecio.monto,
        currency: "ARS",
        reserva_id: id,
      });

      window.sessionStorage.setItem(PENDING_RESERVA_ID_KEY, id);
      window.location.assign(initPoint);
    } catch {
      setPagoError("Error de conexión. Intentá de nuevo.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <>
      <section
        id="formulario-reserva"
        className="relative z-10 px-4 pb-24 pt-8 sm:px-6 md:px-10 lg:px-16"
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
                ref={formRef}
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
                    const nextDraft = getCurrentDraft();
                    if (name === "nombre" || name === "mail" || name === "celular") {
                      nextDraft[name] = target.value;
                    }
                    persistDraft(nextDraft);
                  }
                }}
                onSubmit={handleFormSubmit}
              >
                <input type="hidden" name="modalidad" value={modalidadHidden} readOnly />
                <input type="hidden" name="turno_detalle" value={turnoDetalleHidden} readOnly />
                <input type="hidden" name="precio_referencia_ars" value={precioReferenciaHidden} readOnly />

                <div className="space-y-1.5">
                  <ReservaFormInput
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
                  <ReservaFormInput
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
                  <ReservaFormInput
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
                    persistDraft({ ...getCurrentDraft(), motivo: value });
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

                <input type="hidden" name="turno_codigo" value={turnoCodigoHidden} readOnly />
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
                    const modalidad = value as "" | "grupal" | "consulta_individual";
                    setSelectedModalidad(modalidad);
                    setSelectedHorario("");
                    setSelectedHorarioEvaluacion("");
                    setSelectedFormatoEvaluacion("");
                    setHuecoIndividual(null);
                    setHuecoEvalGrupal(null);
                    if (modalidad !== "consulta_individual") {
                      setSelectedFormatoConsulta("");
                    }
                    persistDraft({
                      ...getCurrentDraft(),
                      modalidad,
                      formatoConsulta: modalidad === "consulta_individual" ? selectedFormatoConsulta : "",
                      horario: "",
                      horarioEvaluacion: "",
                      formatoEvaluacion: "",
                      principalSlotJson: undefined,
                      evalSlotJson: undefined,
                    });
                    setPagoError(null);
                    clearFieldError("modalidad");
                    clearFieldError("horario");
                    clearFieldError("formatoConsulta");
                    clearFieldError("horarioEvaluacion");
                    clearFieldError("formatoEvaluacion");
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

                {selectedModalidad === "consulta_individual" && (
                  <>
                    <CustomPickerField
                      id="formato_consulta"
                      ariaLabel="Consulta presencial o virtual"
                      placeholder={PLACEHOLDER_FORMATO_CONSULTA}
                      value={selectedFormatoConsulta}
                      options={FORMATO_CONSULTA_OPCIONES}
                      isOpen={openPicker === "formatoConsulta"}
                      triggerRef={formatoConsultaTriggerRef}
                      dropdownRef={dropdownRef}
                      rect={dropdownRect}
                      onToggle={() =>
                        setOpenPicker((p) => (p === "formatoConsulta" ? null : "formatoConsulta"))
                      }
                      onSelect={(value) => {
                        const v = value as "presencial" | "virtual";
                        setSelectedFormatoConsulta(v);
                        setHuecoIndividual(null);
                        setSelectedHorario("");
                        persistDraft({
                          ...getCurrentDraft(),
                          formatoConsulta: v,
                          horario: "",
                          principalSlotJson: undefined,
                        });
                        setPagoError(null);
                        clearFieldError("formatoConsulta");
                        setOpenPicker(null);
                        scrollAlCalendarioTrasPintar(calendarioIndividualRef);
                      }}
                      accentColor={accentColor}
                      error={
                        shouldShowError("formatoConsulta")
                          ? fieldErrors.formatoConsulta
                          : undefined
                      }
                    />
                    {shouldShowError("formatoConsulta") && fieldErrors.formatoConsulta && (
                      <p className="-mt-3 px-1 text-sm font-medium text-red-600" role="alert">
                        {fieldErrors.formatoConsulta}
                      </p>
                    )}
                  </>
                )}

                {esGrupal && (
                  <CustomPickerField
                    id="horario"
                    ariaLabel="Horario clases grupales martes y jueves"
                    placeholder={
                      horariosGrupalLoading
                        ? "Cargando franjas disponibles..."
                        : "Horario de clases grupales (martes y jueves)"
                    }
                    value={selectedHorario}
                    options={opcionesHorarioPrincipal}
                    isOpen={openPicker === "horario"}
                    triggerRef={horarioTriggerRef}
                    dropdownRef={dropdownRef}
                    rect={dropdownRect}
                    onToggle={() => setOpenPicker((p) => (p === "horario" ? null : "horario"))}
                    onSelect={(value) => {
                      setSelectedHorario(value);
                      setHuecoEvalGrupal(null);
                      setSelectedHorarioEvaluacion("");
                      persistDraft({
                        ...getCurrentDraft(),
                        horario: value,
                        horarioEvaluacion: "",
                        evalSlotJson: undefined,
                      });
                      setPagoError(null);
                      clearFieldError("horario");
                      clearFieldError("horarioEvaluacion");
                      setOpenPicker(null);
                    }}
                    accentColor={accentColor}
                    error={shouldShowError("horario") ? fieldErrors.horario : undefined}
                    disabled={
                      horariosGrupalLoading ||
                      !horariosGrupalDisponibles ||
                      opcionesHorarioPrincipal.length === 0
                    }
                  />
                )}
                {esGrupal && !horariosGrupalLoading && horariosGrupalDisponibles !== null && opcionesHorarioPrincipal.length === 0 && (
                  <p className="-mt-3 px-1 text-sm text-zinc-600" role="status">
                    No hay franjas grupales disponibles por el momento.
                  </p>
                )}
                {shouldShowError("horario") && fieldErrors.horario && (
                  <p className="-mt-3 px-1 text-sm font-medium text-red-600" role="alert">
                    {fieldErrors.horario}
                  </p>
                )}

                {esIndividual &&
                  (selectedFormatoConsulta === "presencial" ||
                    selectedFormatoConsulta === "virtual") && (
                    <div
                      ref={calendarioIndividualRef}
                      className="scroll-mt-24 scroll-smooth"
                    >
                      <ReservaHuecosCalendario
                      mode="individual"
                      accentColor={accentColor}
                      titulo="Elegí día y horario de la consulta"
                      onSeleccion={(h) => {
                        setHuecoIndividual(h);
                        setSelectedHorario(h.templateId);
                        persistDraft({
                          ...getCurrentDraft(),
                          horario: h.templateId,
                          principalSlotJson: JSON.stringify({
                            dateKey: h.dateKey,
                            timeLocal: h.timeLocal,
                            templateId: h.templateId,
                            etiqueta: h.etiqueta,
                          }),
                        });
                        setPagoError(null);
                        clearFieldError("horario");
                        scrollSuaveTrasElegirHorarioRef.current = true;
                      }}
                    />
                    </div>
                  )}
                {esIndividual &&
                  huecoIndividual &&
                  (selectedFormatoConsulta === "presencial" ||
                    selectedFormatoConsulta === "virtual") && (
                    <p className="-mt-1 px-1 text-sm text-zinc-700" role="status">
                      Turno elegido: <strong className="font-medium">{huecoIndividual.etiqueta}</strong>
                    </p>
                  )}

                {esGrupal && Boolean(selectedHorario) && (
                  <>
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/90 px-3 py-2.5">
                      <p className="text-sm font-semibold text-zinc-800">Agendar evaluación</p>
                      <p className="mt-1 text-sm leading-snug text-zinc-600">
                        Elegí día y horario exactos de la evaluación individual (incluida en el plan). Solo se
                        muestran huecos reales compatibles con tu franja de clases grupales.
                      </p>
                    </div>
                    <CustomPickerField
                      id="formato_evaluacion"
                      ariaLabel="Evaluación presencial o virtual"
                      placeholder={PLACEHOLDER_EVAL_FORMATO}
                      value={selectedFormatoEvaluacion}
                      options={FORMATO_CONSULTA_OPCIONES}
                      isOpen={openPicker === "formatoEvaluacion"}
                      triggerRef={formatoEvaluacionTriggerRef}
                      dropdownRef={dropdownRef}
                      rect={dropdownRect}
                      onToggle={() =>
                        setOpenPicker((p) => (p === "formatoEvaluacion" ? null : "formatoEvaluacion"))
                      }
                      onSelect={(value) => {
                        const v = value as "presencial" | "virtual";
                        setSelectedFormatoEvaluacion(v);
                        setHuecoEvalGrupal(null);
                        setSelectedHorarioEvaluacion("");
                        persistDraft({
                          ...getCurrentDraft(),
                          formatoEvaluacion: v,
                          horarioEvaluacion: "",
                          evalSlotJson: undefined,
                        });
                        setPagoError(null);
                        clearFieldError("formatoEvaluacion");
                        clearFieldError("horarioEvaluacion");
                        setOpenPicker(null);
                        scrollAlCalendarioTrasPintar(calendarioEvalGrupalRef);
                      }}
                      accentColor={accentColor}
                      error={
                        shouldShowError("formatoEvaluacion")
                          ? fieldErrors.formatoEvaluacion
                          : undefined
                      }
                    />
                    {shouldShowError("formatoEvaluacion") && fieldErrors.formatoEvaluacion && (
                      <p className="-mt-3 px-1 text-sm font-medium text-red-600" role="alert">
                        {fieldErrors.formatoEvaluacion}
                      </p>
                    )}
                    {(selectedFormatoEvaluacion === "presencial" ||
                      selectedFormatoEvaluacion === "virtual") && (
                      <div
                        ref={calendarioEvalGrupalRef}
                        className="scroll-mt-24 scroll-smooth"
                      >
                        <ReservaHuecosCalendario
                        mode="grupal-eval"
                        horarioGrupalId={selectedHorario}
                        accentColor={accentColor}
                        titulo="Calendario de la evaluación"
                        onSeleccion={(h) => {
                          setHuecoEvalGrupal(h);
                          setSelectedHorarioEvaluacion(h.templateId);
                          persistDraft({
                            ...getCurrentDraft(),
                            horarioEvaluacion: h.templateId,
                            evalSlotJson: JSON.stringify({
                              dateKey: h.dateKey,
                              timeLocal: h.timeLocal,
                              templateId: h.templateId,
                              etiqueta: h.etiqueta,
                            }),
                          });
                          setPagoError(null);
                          clearFieldError("horarioEvaluacion");
                          scrollSuaveTrasElegirHorarioRef.current = true;
                        }}
                      />
                      </div>
                    )}
                    {huecoEvalGrupal &&
                      (selectedFormatoEvaluacion === "presencial" ||
                        selectedFormatoEvaluacion === "virtual") && (
                        <p className="-mt-1 px-1 text-sm text-zinc-700" role="status">
                          Evaluación:{" "}
                          <strong className="font-medium">{huecoEvalGrupal.etiqueta}</strong>
                        </p>
                      )}
                    {shouldShowError("horarioEvaluacion") && fieldErrors.horarioEvaluacion && (
                      <p className="-mt-3 px-1 text-sm font-medium text-red-600" role="alert">
                        {fieldErrors.horarioEvaluacion}
                      </p>
                    )}
                  </>
                )}

                {turnoCompleto && (
                  <div
                    ref={pagoYEnvioRef}
                    className="flex scroll-mt-20 flex-col gap-5"
                  >
                    {resumenPrecio && (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                        <p className="font-medium text-zinc-800">Importe de referencia</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                          ${resumenPrecio.monto.toLocaleString("es-AR")}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{resumenPrecio.descripcion}</p>
                      </div>
                    )}

                    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
                      <p className="text-sm font-semibold text-zinc-800">Pago con Mercado Pago</p>
                      <p className="mt-1 text-sm text-zinc-600">
                        La reserva se registra al continuar y se{" "}
                        <strong>confirma solo cuando Mercado Pago aprueba el pago</strong>                         del total:{" "}
                        <span className="font-semibold text-zinc-900">
                          ${(resumenPrecio?.monto ?? 0).toLocaleString("es-AR")}
                        </span>
                        .
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        Volvé del checkout con el botón de Mercado Pago; el estado final lo define el
                        webhook (no esta página).
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <MercadoPagoButton
                          type="button"
                          onClick={() => {
                            gaEvent("pagar_reservar_mercadopago_click", {
                              modalidad: selectedModalidad || "sin_modalidad",
                              turno_completo: turnoCompleto,
                              value: resumenPrecio?.monto ?? 0,
                              currency: "ARS",
                            });
                            void iniciarCheckoutMercadoPago();
                          }}
                          label={
                            checkoutLoading ? "Preparando checkout..." : "Pagar y reservar con Mercado Pago"
                          }
                          disabled={checkoutLoading}
                        />
                      </div>
                      {pagoError && (
                        <p className="mt-2 text-sm font-medium text-red-600" role="alert">
                          {pagoError}
                        </p>
                      )}
                    </div>

                    {envioError && (
                      <p className="text-sm font-medium text-red-600" role="alert">
                        {envioError}
                      </p>
                    )}
                  </div>
                )}

                {!turnoCompleto && envioError && (
                  <p className="text-sm font-medium text-red-600" role="alert">
                    {envioError}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
