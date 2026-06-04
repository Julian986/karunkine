"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  PanelTurnoFechaHoraPicker,
  type PanelFechaHoraSeleccion,
} from "../../components/PanelTurnoFechaHoraPicker";
import { panelCard, panelPrimaryBtn } from "../../../components/panel/panel-ui";
import { matchGrupalTemplate } from "../../../lib/turnos/wanda-schedule";
import {
  expandRecurringDateKeys,
  type PanelRepeatMode,
  PANEL_HORARIO_LIBRE,
  PANEL_REPEAT_MAX_MONTHLY,
  PANEL_REPEAT_MAX_WEEKLY,
} from "../../../lib/turnos/panel-manual-schedule-shared";

const MOTIVOS = [
  { value: "suelo_pelvico", label: "Disfunción de suelo pélvico" },
  { value: "embarazo", label: "Embarazo" },
  { value: "posparto", label: "Posparto" },
  { value: "lesion", label: "Lesión" },
  { value: "dolor", label: "Dolor" },
  { value: "postura", label: "Postura" },
] as const;

const HORARIOS_GRUPAL = [
  { value: "grupal_930", label: "Martes y Jueves - 9:30H" },
  { value: "grupal_1030", label: "Martes y Jueves - 10:30H" },
  { value: "grupal_15", label: "Martes y Jueves - 15:00H" },
  { value: "grupal_16", label: "Martes y Jueves - 16H" },
  { value: "grupal_17", label: "Martes y Jueves - 17H" },
] as const;

const iconChevronDown = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

type FieldErrorMap = Partial<Record<string, string>>;

function firstFieldErrorsFromApi(details: unknown): FieldErrorMap {
  if (!details || typeof details !== "object") return {};
  const raw = details as { fieldErrors?: Record<string, unknown> };
  if (!raw.fieldErrors || typeof raw.fieldErrors !== "object") return {};
  const out: FieldErrorMap = {};
  for (const [key, value] of Object.entries(raw.fieldErrors)) {
    if (!Array.isArray(value) || value.length === 0) continue;
    const first = value[0];
    if (typeof first === "string" && first.trim()) out[key] = first.trim();
  }
  return out;
}

export function PanelNuevoTurnoClient() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [mail, setMail] = useState("");
  const [celular, setCelular] = useState("");
  const [motivo, setMotivo] = useState("");
  const [modalidad, setModalidad] = useState<"" | "grupal" | "consulta_individual">("");
  const [formatoConsulta, setFormatoConsulta] = useState<"" | "presencial" | "virtual">("");
  const [horarioGrupal, setHorarioGrupal] = useState("");
  const [horariosGrupalDisponibles, setHorariosGrupalDisponibles] = useState<string[] | null>(null);
  const [horariosGrupalLoading, setHorariosGrupalLoading] = useState(false);
  const [soloClaseGrupal, setSoloClaseGrupal] = useState(false);
  const [formatoEvaluacion, setFormatoEvaluacion] = useState<"" | "presencial" | "virtual">("");
  const [slotIndividual, setSlotIndividual] = useState<PanelFechaHoraSeleccion | null>(null);
  const [slotEvalGrupal, setSlotEvalGrupal] = useState<PanelFechaHoraSeleccion | null>(null);
  const [repetirModo, setRepetirModo] = useState<"" | PanelRepeatMode>("");
  const [repetirHasta, setRepetirHasta] = useState("");
  const [notaInterna, setNotaInterna] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const evalCalendarWrapRef = useRef<HTMLDivElement | null>(null);

  const esIndividual = modalidad === "consulta_individual";
  const esGrupal = modalidad === "grupal";
  const puedeRepetir = esIndividual || (esGrupal && !soloClaseGrupal && Boolean(slotEvalGrupal));
  const anclaRepeticion = esIndividual ? slotIndividual?.dateKey : slotEvalGrupal?.dateKey;

  const previewRepeticion = useMemo(() => {
    if (!puedeRepetir || !anclaRepeticion || !repetirModo) return { count: 0, sinFin: false, modo: "" as const };
    const fechas = expandRecurringDateKeys({
      anchorDateKey: anclaRepeticion,
      repeatMode: repetirModo,
      repeatUntilDateKey: repetirHasta.trim() || null,
    });
    return {
      count: fechas.length,
      sinFin: !repetirHasta.trim(),
      modo: repetirModo,
    };
  }, [puedeRepetir, anclaRepeticion, repetirModo, repetirHasta]);
  const opcionesGrupalDisponibles = useMemo(() => {
    if (!horariosGrupalDisponibles) return [];
    const enabled = new Set(horariosGrupalDisponibles);
    return HORARIOS_GRUPAL.filter((h) => enabled.has(h.value));
  }, [horariosGrupalDisponibles]);

  useEffect(() => {
    if (!esGrupal || !soloClaseGrupal) {
      if (!esGrupal) {
        setHorariosGrupalDisponibles(null);
        setHorariosGrupalLoading(false);
      }
      return;
    }
    let alive = true;
    (async () => {
      setHorariosGrupalLoading(true);
      try {
        const res = await fetch("/api/reservas/disponibilidad/grupal-horarios", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as { horarios?: string[] };
        if (!alive) return;
        const horarios = Array.isArray(data.horarios)
          ? data.horarios.filter((h): h is string => typeof h === "string")
          : [];
        setHorariosGrupalDisponibles(horarios);
        if (horarioGrupal && !horarios.includes(horarioGrupal)) {
          setHorarioGrupal("");
          setSlotEvalGrupal(null);
          setFormatoEvaluacion("");
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
  }, [esGrupal, horarioGrupal, soloClaseGrupal]);

  useEffect(() => {
    const evaluacionAbierta =
      esGrupal &&
      !soloClaseGrupal &&
      (formatoEvaluacion === "presencial" || formatoEvaluacion === "virtual");
    if (!evaluacionAbierta) return;
    const doScroll = () => {
      const scroller = document.scrollingElement ?? document.documentElement;
      const maxTop = Math.max(
        scroller.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );
      window.scrollTo({ top: maxTop, behavior: "smooth" });
    };
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(doScroll);
    });
    const t = window.setTimeout(doScroll, 140);
    return () => window.clearTimeout(t);
  }, [soloClaseGrupal, esGrupal, formatoEvaluacion]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setFieldErrors({});
    setBusy(true);
    try {
      const nextErrors: FieldErrorMap = {};
      const cleanNombre = nombre.trim();
      const cleanMail = mail.trim();
      const cleanCelular = celular.trim();
      if (cleanNombre.length < 3) nextErrors.nombre = "Ingresá nombre y apellido (mínimo 3 caracteres).";
      if (cleanMail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanMail)) {
        nextErrors.mail = "Ingresá un mail válido o dejalo vacío.";
      }
      if (cleanCelular.length > 0 && cleanCelular.length < 8) {
        nextErrors.celular = "Si cargás celular, usá al menos 8 caracteres.";
      }
      if (!motivo) nextErrors.motivo = "Elegí un motivo.";
      if (!modalidad) nextErrors.modalidad = "Elegí una modalidad.";
      if (modalidad === "consulta_individual") {
        if (!formatoConsulta) nextErrors.formatoConsulta = "Elegí el formato de consulta.";
        if (!slotIndividual) nextErrors.principalSlot = "Elegí día y horario de consulta.";
      }
      if (modalidad === "grupal") {
        if (soloClaseGrupal) {
          if (!horarioGrupal) nextErrors.horario = "Elegí una franja de clases mar/jue.";
        } else {
          if (!formatoEvaluacion) nextErrors.formatoEvaluacion = "Elegí el formato de evaluación.";
          if (!slotEvalGrupal) nextErrors.evalSlot = "Elegí día y horario de evaluación.";
        }
      }
      if (puedeRepetir && repetirModo && repetirHasta.trim() && anclaRepeticion) {
        if (repetirHasta.trim() < anclaRepeticion) {
          nextErrors.repeatUntilDateKey = "La fecha de fin debe ser posterior al primer turno.";
        }
      }
      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        setMsg("Revisá los campos marcados.");
        return;
      }

      const repeatPayload = puedeRepetir && repetirModo
        ? {
            repeatMode: repetirModo,
            repeatUntilDateKey: repetirHasta.trim() ? repetirHasta.trim() : undefined,
          }
        : {};

      const payload =
        esIndividual && slotIndividual
          ? {
              nombre,
              mail,
              celular,
              motivo,
              modalidad,
              horario: PANEL_HORARIO_LIBRE,
              formatoConsulta,
              principalSlot: {
                dateKey: slotIndividual.dateKey,
                timeLocal: slotIndividual.timeLocal,
              },
              ...repeatPayload,
              notaInterna: notaInterna.trim() || undefined,
            }
          : esGrupal && soloClaseGrupal && Boolean(horarioGrupal)
            ? {
                nombre,
                mail,
                celular,
                motivo,
                modalidad,
                horario: horarioGrupal,
                notaInterna: notaInterna.trim() || undefined,
              }
            : esGrupal && !soloClaseGrupal && slotEvalGrupal
              ? {
                  nombre,
                  mail,
                  celular,
                  motivo,
                  modalidad,
                  horario:
                    (slotEvalGrupal &&
                      matchGrupalTemplate(slotEvalGrupal.dateKey, slotEvalGrupal.timeLocal)) ||
                    "",
                  formatoEvaluacion,
                  evalSlot: {
                    dateKey: slotEvalGrupal.dateKey,
                    timeLocal: slotEvalGrupal.timeLocal,
                  },
                  ...repeatPayload,
                  notaInterna: notaInterna.trim() || undefined,
                }
              : null;

      if (!payload) {
        setMsg("Completá los datos obligatorios.");
        return;
      }

      const res = await fetch("/api/panel-turnos/nuevo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: unknown;
        fechasOmitidas?: string[];
      };
      if (!res.ok) {
        const apiFieldErrors = firstFieldErrorsFromApi(data.details);
        if (Object.keys(apiFieldErrors).length > 0) {
          setFieldErrors(apiFieldErrors);
          setMsg("Revisá los campos marcados.");
        } else {
          setMsg(data.error ?? "No se pudo crear el turno.");
        }
        return;
      }
      const omitidas = Array.isArray(data.fechasOmitidas) ? data.fechasOmitidas : [];
      if (omitidas.length > 0) {
        const muestra = omitidas.slice(0, 5).join(", ");
        const extra = omitidas.length > 5 ? ` y ${omitidas.length - 5} más` : "";
        window.alert(
          `Turno creado. ${omitidas.length} fecha(s) no se agregaron (ocupadas o bloqueadas): ${muestra}${extra}.`,
        );
      }
      router.push("/panel-turnos?creado=1");
      router.refresh();
    } catch {
      setMsg("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${panelCard} p-5`}>
      <h1 className="text-lg font-semibold text-gray-900">Nuevo turno manual</h1>
      <p className="mt-1 text-xs text-gray-500">Alta directa sin pago (confirmado en el momento).</p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido" className="w-full rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none" />
        {fieldErrors.nombre ? <p className="text-xs text-red-700">{fieldErrors.nombre}</p> : null}
        <input value={mail} onChange={(e) => setMail(e.target.value)} placeholder="Mail (opcional)" type="email" className="w-full rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none" />
        {fieldErrors.mail ? <p className="text-xs text-red-700">{fieldErrors.mail}</p> : null}
        <input value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="Celular (opcional)" className="w-full rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none" />
        {fieldErrors.celular ? <p className="text-xs text-red-700">{fieldErrors.celular}</p> : null}
        <div className="relative">
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className={`w-full appearance-none rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none ${
              motivo ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"
            }`}
          >
            <option value="" disabled hidden>Elegir motivo</option>
            {MOTIVOS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-cream)]/65">
            {iconChevronDown}
          </span>
        </div>
        {fieldErrors.motivo ? <p className="text-xs text-red-700">{fieldErrors.motivo}</p> : null}
        <div className="relative">
          <select
            value={modalidad}
            onChange={(e) => {
              const m = e.target.value as "" | "grupal" | "consulta_individual";
              setModalidad(m);
              setSlotIndividual(null);
              setSlotEvalGrupal(null);
              setHorarioGrupal("");
              setSoloClaseGrupal(false);
              setFormatoConsulta("");
              setFormatoEvaluacion("");
              setRepetirModo("");
              setRepetirHasta("");
            }}
            className={`w-full appearance-none rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none ${
              modalidad ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"
            }`}
          >
            <option value="" disabled hidden>Elegir modalidad</option>
            <option value="consulta_individual">Consulta individual</option>
            <option value="grupal">Clases grupales</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-cream)]/65">
            {iconChevronDown}
          </span>
        </div>
        {fieldErrors.modalidad ? <p className="text-xs text-red-700">{fieldErrors.modalidad}</p> : null}

        {esIndividual && (
          <>
            <div className="relative">
              <select value={formatoConsulta} onChange={(e) => setFormatoConsulta(e.target.value as "presencial" | "virtual" | "")} className={`w-full appearance-none rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none ${formatoConsulta ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"}`}>
                <option value="" disabled hidden>Formato de consulta</option>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-cream)]/65">
                {iconChevronDown}
              </span>
            </div>
            {fieldErrors.formatoConsulta ? <p className="text-xs text-red-700">{fieldErrors.formatoConsulta}</p> : null}
            {(formatoConsulta === "presencial" || formatoConsulta === "virtual") && (
              <PanelTurnoFechaHoraPicker
                accentColor="#B88E2F"
                titulo="Elegí día y horario"
                onSeleccion={(h) => setSlotIndividual(h)}
              />
            )}
            {fieldErrors.principalSlot ? <p className="text-xs text-red-700">{fieldErrors.principalSlot}</p> : null}
          </>
        )}

        {esGrupal && (
          <>
            <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2.5">
              <input
                type="checkbox"
                checked={soloClaseGrupal}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSoloClaseGrupal(checked);
                  if (checked) {
                    setFormatoEvaluacion("");
                    setSlotEvalGrupal(null);
                    setRepetirModo("");
                    setRepetirHasta("");
                  } else {
                    setHorarioGrupal("");
                  }
                }}
                className="mt-0.5 h-4 w-4 rounded border-black/20 accent-[var(--brand-ui-primary)]"
              />
              <span className="text-sm text-[var(--brand-cream)]/85">
                Solo ciclo de clases mar/jue (sin evaluación con horario libre)
              </span>
            </label>

            {soloClaseGrupal ? (
              <>
                <div className="relative">
                  <select
                    value={horarioGrupal}
                    onChange={(e) => setHorarioGrupal(e.target.value)}
                    disabled={horariosGrupalLoading || opcionesGrupalDisponibles.length === 0}
                    className={`w-full appearance-none rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none disabled:opacity-60 ${horarioGrupal ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"}`}
                  >
                    <option value="" disabled hidden>
                      {horariosGrupalLoading ? "Cargando franjas..." : "Elegir franja de clases"}
                    </option>
                    {opcionesGrupalDisponibles.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-cream)]/65">
                    {iconChevronDown}
                  </span>
                </div>
                {fieldErrors.horario ? <p className="text-xs text-red-700">{fieldErrors.horario}</p> : null}
                {!horariosGrupalLoading && opcionesGrupalDisponibles.length === 0 && (
                  <p className="text-xs text-[var(--brand-cream)]/60">
                    No hay franjas grupales disponibles en este momento.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="relative">
                  <select
                    value={formatoEvaluacion}
                    onChange={(e) => setFormatoEvaluacion(e.target.value as "presencial" | "virtual" | "")}
                    className={`w-full appearance-none rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none ${formatoEvaluacion ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"}`}
                  >
                    <option value="" disabled hidden>
                      Formato de evaluación
                    </option>
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-cream)]/65">
                    {iconChevronDown}
                  </span>
                </div>
                {fieldErrors.formatoEvaluacion ? (
                  <p className="text-xs text-red-700">{fieldErrors.formatoEvaluacion}</p>
                ) : null}
                {(formatoEvaluacion === "presencial" || formatoEvaluacion === "virtual") && (
                  <div ref={evalCalendarWrapRef}>
                    <PanelTurnoFechaHoraPicker
                      accentColor="#B88E2F"
                      titulo="Elegí evaluación (día y hora libres)"
                      onSeleccion={(h) => setSlotEvalGrupal(h)}
                    />
                    <p className="mt-2 text-xs leading-snug text-[var(--brand-cream)]/60">
                      Evaluación libre (cualquier día y hora). En el calendario solo verás esas evaluaciones.
                      El ciclo de clases mar/jue se carga solo con la opción &quot;Solo ciclo de clases&quot; abajo.
                    </p>
                  </div>
                )}
                {fieldErrors.evalSlot ? <p className="text-xs text-red-700">{fieldErrors.evalSlot}</p> : null}
              </>
            )}
          </>
        )}

        {puedeRepetir && (slotIndividual || slotEvalGrupal) ? (
          <div className="space-y-2 rounded-xl border border-black/10 bg-black/[0.03] px-3 py-3">
            <div className="relative">
              <select
                value={repetirModo}
                onChange={(e) => {
                  const v = e.target.value as "" | PanelRepeatMode;
                  setRepetirModo(v);
                  if (!v) setRepetirHasta("");
                }}
                className={`w-full appearance-none rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none ${
                  repetirModo ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"
                }`}
              >
                <option value="">No repetir (un solo turno)</option>
                <option value="weekly">Cada semana (mismo día de la semana)</option>
                <option value="monthly">Cada mes (mismo día de la semana, ej. cada miércoles)</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-cream)]/65">
                {iconChevronDown}
              </span>
            </div>
            {repetirModo ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-[var(--brand-cream)]/60" htmlFor="repetir-hasta">
                    Fecha de fin (opcional)
                  </label>
                  <input
                    id="repetir-hasta"
                    type="date"
                    value={repetirHasta}
                    onChange={(e) => setRepetirHasta(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none"
                  />
                  {fieldErrors.repeatUntilDateKey ? (
                    <p className="mt-1 text-xs text-red-700">{fieldErrors.repeatUntilDateKey}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--brand-cream)]/55">
                    Sin fecha de fin: hasta{" "}
                    {repetirModo === "monthly"
                      ? `${PANEL_REPEAT_MAX_MONTHLY} meses`
                      : `${PANEL_REPEAT_MAX_WEEKLY} semanas`}{" "}
                    hacia adelante.
                  </p>
                </div>
                <p className="text-xs font-medium text-[var(--brand-cream)]/75">
                  {previewRepeticion.sinFin
                    ? `Vista previa: ${previewRepeticion.count} citas (máx. ${
                        previewRepeticion.modo === "monthly"
                          ? PANEL_REPEAT_MAX_MONTHLY
                          : PANEL_REPEAT_MAX_WEEKLY
                      } ${previewRepeticion.modo === "monthly" ? "meses" : "semanas"}).`
                    : previewRepeticion.count > 0
                      ? `Vista previa: ${previewRepeticion.count} citas en el rango.`
                      : "No hay fechas en el rango elegido."}
                </p>
              </>
            ) : null}
          </div>
        ) : null}

        <textarea
          value={notaInterna}
          onChange={(e) => setNotaInterna(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Nota interna (opcional)"
          className="max-h-32 w-full resize-y overflow-y-auto rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none"
        />

        {msg && <p className="text-sm text-red-700">{msg}</p>}

        <button type="submit" disabled={busy} className={panelPrimaryBtn}>
          {busy ? "Guardando..." : "Crear turno confirmado"}
        </button>
      </form>
    </section>
  );
}
