"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type TurnoEstado =
  | "pending_payment"
  | "pendiente"
  | "contactado"
  | "confirmado"
  | "cancelado"
  | "expirado";

type Option = { value: string; label: string };
type DropdownRect = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

type TurnoRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  nombre: string;
  mail: string;
  celular: string;
  motivo: string;
  modalidad: "grupal" | "consulta_individual";
  turnoDetalle: string;
  precioReferenciaArs: number;
  estado: TurnoEstado;
  notaInterna: string;
  canceladoPor?: "profesional" | "paciente";
  motivoCancelacion?: string;
};

const ESTADO_OPCIONES: { value: TurnoEstado; label: string }[] = [
  { value: "pending_payment", label: "Pendiente de pago" },
  { value: "pendiente", label: "Pendiente (legado)" },
  { value: "contactado", label: "Contactado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "expirado", label: "Expirada (sin pago)" },
];

const FILTRO_ESTADO = [
  { value: "todos", label: "Todos los estados" },
  ...ESTADO_OPCIONES,
] as const;

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

const DROPDOWN_MARGIN = 12;
const DROPDOWN_GAP = 6;
const DROPDOWN_MAX_HEIGHT = 320;

function computeDropdownRect(trigger: HTMLElement | null): DropdownRect | null {
  if (typeof window === "undefined" || !trigger) return null;
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(rect.width, window.innerWidth - DROPDOWN_MARGIN * 2);
  const left = Math.max(
    DROPDOWN_MARGIN,
    Math.min(rect.left, window.innerWidth - width - DROPDOWN_MARGIN)
  );
  const spaceBelow = window.innerHeight - rect.bottom - DROPDOWN_MARGIN;
  const maxHeight = Math.max(120, Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow - DROPDOWN_GAP));
  return {
    top: rect.bottom + DROPDOWN_GAP,
    left,
    width,
    maxHeight,
  };
}

function PanelPicker({
  ariaLabel,
  placeholder,
  value,
  options,
  onSelect,
  buttonClassName,
}: {
  ariaLabel: string;
  placeholder: string;
  value: string;
  options: readonly Option[];
  onSelect: (value: string) => void;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DropdownRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const accentColor = "#a56a42";
  const accentSoft = "rgba(165,106,66,0.14)";

  const updatePosition = useCallback(() => {
    setRect(computeDropdownRect(triggerRef.current));
  }, []);

  useEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    updatePosition();
    const handleViewportChange = () => updatePosition();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideDropdown = dropdownRef.current?.contains(target);
      const insideTrigger = triggerRef.current?.contains(target);
      if (!insideDropdown && !insideTrigger) setOpen(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`relative flex h-9 w-full min-w-0 items-center rounded-lg border border-zinc-300 bg-white px-3 pr-9 text-left text-sm text-zinc-800 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:border-zinc-400 ${buttonClassName ?? ""}`}
      >
        <span className={`block min-w-0 flex-1 truncate ${selected ? "text-zinc-800" : "text-zinc-500"}`}>
          {selected?.label ?? placeholder}
        </span>
        <span
          className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        >
          {iconChevron}
        </span>
      </button>

      {open && rect && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[160] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              maxHeight: rect.maxHeight,
            }}
          >
            <div className="max-h-full overflow-y-auto p-1.5 pb-3">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onSelect(option.value);
                      setOpen(false);
                    }}
                    className="relative flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                    style={isSelected ? { backgroundColor: accentSoft, color: accentColor } : undefined}
                  >
                    <span className="block min-w-0 flex-1 truncate pr-6">{option.label}</span>
                    <span
                      className="pointer-events-none absolute right-2 flex h-4 w-4 items-center justify-center"
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

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusClassName(status: TurnoEstado): string {
  if (status === "confirmado") return "bg-emerald-100 text-emerald-800";
  if (status === "contactado") return "bg-amber-100 text-amber-800";
  if (status === "cancelado") return "bg-red-100 text-red-800";
  if (status === "expirado") return "bg-zinc-300 text-zinc-800";
  if (status === "pending_payment") return "bg-sky-100 text-sky-900";
  return "bg-zinc-200 text-zinc-700";
}

function normalizePhoneForWhatsApp(rawPhone: string): string | null {
  const onlyDigits = rawPhone.replace(/\D/g, "");
  if (onlyDigits.length < 10) return null;

  // Casos ya internacionalizados
  if (onlyDigits.startsWith("549")) {
    return onlyDigits.length >= 12 && onlyDigits.length <= 15 ? onlyDigits : null;
  }
  if (onlyDigits.startsWith("54")) {
    const withCountry = onlyDigits.slice(2);
    if (withCountry.startsWith("9")) {
      return onlyDigits.length >= 12 && onlyDigits.length <= 15 ? onlyDigits : null;
    }
    const withoutTrunkZero = withCountry.replace(/^0+/, "");
    const withoutNational15 = withoutTrunkZero.replace(/^(\d{2,4})15/, "$1");
    const normalized = `549${withoutNational15}`;
    return normalized.length >= 12 && normalized.length <= 15 ? normalized : null;
  }

  // Casos locales Argentina: 0 + area + 15 + numero, o area + numero
  let national = onlyDigits.replace(/^0+/, "");
  national = national.replace(/^(\d{2,4})15/, "$1");
  if (national.startsWith("9")) national = national.slice(1);
  const normalized = `549${national}`;
  return normalized.length >= 12 && normalized.length <= 15 ? normalized : null;
}

const PROFESIONAL_WHATSAPP_FIRMA = "Wanda Perrin";

function buildWhatsAppReminderMessage(turno: TurnoRecord): string {
  const nombrePaciente = turno.nombre.trim() || "te";
  const horarioTexto = turno.turnoDetalle.trim();
  const cuerpoHorario = horarioTexto
    ? `, ${horarioTexto}`
    : "";
  return `Hola ${nombrePaciente}, soy ${PROFESIONAL_WHATSAPP_FIRMA}. Te escribo para recordarte nuestro encuentro de hoy${cuerpoHorario}.`;
}

function buildWhatsAppLink(turno: TurnoRecord): string | null {
  const phone = normalizePhoneForWhatsApp(turno.celular);
  if (!phone) return null;

  const message = buildWhatsAppReminderMessage(turno);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function PanelTurnosPage() {
  const [turnos, setTurnos] = useState<TurnoRecord[]>([]);
  const [filtroEstado, setFiltroEstado] =
    useState<(typeof FILTRO_ESTADO)[number]["value"]>("todos");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);

  const cargarTurnos = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const response = await fetch("/api/turnos", { cache: "no-store" });
      if (!response.ok) {
        setErrorCarga("No se pudieron cargar los turnos.");
        return;
      }
      const json = (await response.json()) as { data?: TurnoRecord[] };
      setTurnos(Array.isArray(json.data) ? json.data : []);
    } catch {
      setErrorCarga("No se pudieron cargar los turnos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarTurnos();
  }, [cargarTurnos]);

  const turnosFiltrados = useMemo(() => {
    if (filtroEstado === "todos") return turnos;
    return turnos.filter((t) => t.estado === filtroEstado);
  }, [turnos, filtroEstado]);

  const total = turnos.length;
  const grupal = turnos.filter((t) => t.modalidad === "grupal").length;
  const individual = turnos.filter((t) => t.modalidad === "consulta_individual").length;
  const pendientes = turnos.filter(
    (t) => t.estado === "pendiente" || t.estado === "pending_payment"
  ).length;

  async function actualizarEstado(id: string, estado: TurnoEstado) {
    setTurnos((prev) =>
      prev.map((turno) => {
        if (turno.id !== id) return turno;
        return {
          ...turno,
          estado,
          updatedAt: new Date().toISOString(),
          canceladoPor: estado === "cancelado" ? turno.canceladoPor : undefined,
          motivoCancelacion: estado === "cancelado" ? turno.motivoCancelacion : undefined,
        };
      })
    );
    setGuardandoId(id);
    try {
      const response = await fetch(`/api/turnos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!response.ok) {
        await cargarTurnos();
      }
    } catch {
      await cargarTurnos();
    } finally {
      setGuardandoId(null);
    }
  }

  function actualizarNotaLocal(id: string, notaInterna: string) {
    setTurnos((prev) =>
      prev.map((turno) =>
        turno.id === id
          ? { ...turno, notaInterna, updatedAt: new Date().toISOString() }
          : turno
      )
    );
  }

  async function guardarNota(id: string, notaInterna: string) {
    setGuardandoId(id);
    try {
      const response = await fetch(`/api/turnos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notaInterna }),
      });
      if (!response.ok) {
        await cargarTurnos();
      }
    } catch {
      await cargarTurnos();
    } finally {
      setGuardandoId(null);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 pb-12 pt-24 sm:px-6 md:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
                Panel de turnos
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Gestión de reservas: estado y notas internas.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold tracking-wide text-white">
                Acceso privado
              </span>
              <form action="/api/panel-auth/logout" method="post">
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Registros totales</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{total}</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Clases grupales</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{grupal}</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Consulta individual</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{individual}</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Pendientes de respuesta</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{pendientes}</p>
          </article>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900">Reservas recibidas</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="filtro-estado" className="text-sm text-zinc-600">
                Filtrar:
              </label>
              <div className="w-52">
                <PanelPicker
                  ariaLabel="Filtrar por estado"
                  placeholder="Todos los estados"
                  value={filtroEstado}
                  options={FILTRO_ESTADO}
                  onSelect={(value) =>
                    setFiltroEstado(
                      value as (typeof FILTRO_ESTADO)[number]["value"]
                    )
                  }
                />
              </div>
            </div>
          </div>

          {cargando && (
            <p className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              Cargando turnos...
            </p>
          )}
          {errorCarga && (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <span>{errorCarga}</span>
              <button
                type="button"
                onClick={() => void cargarTurnos()}
                className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold transition hover:bg-red-100"
              >
                Reintentar
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500">
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Persona</th>
                  <th className="px-3 py-2 font-medium">Turno</th>
                  <th className="px-3 py-2 font-medium">Precio ref.</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium">Nota interna</th>
                </tr>
              </thead>
              <tbody>
                {turnosFiltrados.map((turno) => (
                  <tr key={turno.id} className="border-b border-zinc-100 align-top">
                    <td className="px-3 py-3 text-zinc-600">{formatDate(turno.createdAt)}</td>
                    <td className="px-3 py-3">
                      {(() => {
                        const whatsappLink = buildWhatsAppLink(turno);
                        return (
                          <>
                      <p className="font-medium text-zinc-900">{turno.nombre}</p>
                      <p className="text-zinc-700">{turno.mail}</p>
                      {whatsappLink ? (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-zinc-700 underline decoration-zinc-300 underline-offset-2 transition hover:text-[#25D366] hover:decoration-[#25D366]"
                          aria-label={`Abrir chat de WhatsApp para ${turno.nombre}`}
                        >
                          {turno.celular}
                          <span className="text-xs font-medium text-zinc-500">WhatsApp</span>
                        </a>
                      ) : (
                        <p className="text-zinc-500">{turno.celular}</p>
                      )}
                      {!whatsappLink && (
                        <p className="mt-1 text-xs text-zinc-400">
                          Número no válido para abrir WhatsApp.
                        </p>
                      )}
                      <p className="mt-1 text-xs text-zinc-500">
                        Motivo: {turno.motivo}
                      </p>
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 text-zinc-700">
                      <p>
                        {turno.modalidad === "grupal"
                          ? "Clases grupales"
                          : "Consulta individual"}
                      </p>
                      <p className="text-zinc-500">{turno.turnoDetalle}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-700">
                      {formatMoney(turno.precioReferenciaArs)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`mb-2 inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${statusClassName(
                          turno.estado
                        )}`}
                      >
                        {turno.estado}
                      </span>
                      <div className="mt-1 w-36">
                        <PanelPicker
                          ariaLabel={`Estado del turno ${turno.id}`}
                          placeholder="Estado"
                          value={turno.estado}
                          options={ESTADO_OPCIONES}
                          onSelect={(value) =>
                            void actualizarEstado(turno.id, value as TurnoEstado)
                          }
                          buttonClassName="h-8 text-xs"
                        />
                      </div>
                      {guardandoId === turno.id && (
                        <p className="mt-2 text-xs text-zinc-500">Guardando...</p>
                      )}
                      {turno.estado === "cancelado" && (
                        <p className="mt-2 text-xs text-red-700">
                          {turno.canceladoPor
                            ? `Cancelado por ${turno.canceladoPor}.`
                            : "Cancelado."}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <textarea
                        className="min-h-20 w-52 rounded-md border border-zinc-300 px-2.5 py-2 text-xs text-zinc-700 outline-none transition focus:border-zinc-500"
                        placeholder="Agregar nota interna..."
                        value={turno.notaInterna}
                        onChange={(e) => actualizarNotaLocal(turno.id, e.target.value)}
                        onBlur={(e) => void guardarNota(turno.id, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
                {turnosFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-sm text-zinc-500"
                    >
                      No hay registros para el filtro seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
