"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ReservaHuecosCalendario, type HuecoSeleccionado } from "../../components/ReservaHuecosCalendario";

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
  const [agregarEvaluacionGrupal, setAgregarEvaluacionGrupal] = useState(false);
  const [formatoEvaluacion, setFormatoEvaluacion] = useState<"" | "presencial" | "virtual">("");
  const [huecoIndividual, setHuecoIndividual] = useState<HuecoSeleccionado | null>(null);
  const [huecoEvalGrupal, setHuecoEvalGrupal] = useState<HuecoSeleccionado | null>(null);
  const [notaInterna, setNotaInterna] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const evalCalendarWrapRef = useRef<HTMLDivElement | null>(null);

  const esIndividual = modalidad === "consulta_individual";
  const esGrupal = modalidad === "grupal";
  const opcionesGrupalDisponibles = useMemo(() => {
    if (!horariosGrupalDisponibles) return [];
    const enabled = new Set(horariosGrupalDisponibles);
    return HORARIOS_GRUPAL.filter((h) => enabled.has(h.value));
  }, [horariosGrupalDisponibles]);

  useEffect(() => {
    if (!esGrupal) {
      setHorariosGrupalDisponibles(null);
      setHorariosGrupalLoading(false);
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
          setHuecoEvalGrupal(null);
          setAgregarEvaluacionGrupal(false);
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
  }, [esGrupal, horarioGrupal]);

  useEffect(() => {
    const evaluacionAbierta =
      esGrupal &&
      agregarEvaluacionGrupal &&
      Boolean(horarioGrupal) &&
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
  }, [agregarEvaluacionGrupal, esGrupal, formatoEvaluacion, horarioGrupal]);

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
      if (cleanCelular.length < 8) nextErrors.celular = "Ingresá un celular válido.";
      if (!motivo) nextErrors.motivo = "Elegí un motivo.";
      if (!modalidad) nextErrors.modalidad = "Elegí una modalidad.";
      if (modalidad === "consulta_individual") {
        if (!formatoConsulta) nextErrors.formatoConsulta = "Elegí el formato de consulta.";
        if (!huecoIndividual) nextErrors.principalSlot = "Elegí día y horario de consulta.";
      }
      if (modalidad === "grupal") {
        if (!horarioGrupal) nextErrors.horario = "Elegí una franja grupal.";
        if (agregarEvaluacionGrupal) {
          if (!formatoEvaluacion) nextErrors.formatoEvaluacion = "Elegí el formato de evaluación.";
          if (!huecoEvalGrupal) nextErrors.evalSlot = "Elegí día y horario de evaluación.";
        }
      }
      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        setMsg("Revisá los campos marcados.");
        return;
      }

      const payload =
        esIndividual && huecoIndividual
          ? {
              nombre,
              mail,
              celular,
              motivo,
              modalidad,
              horario: huecoIndividual.templateId,
              formatoConsulta,
              principalSlot: {
                dateKey: huecoIndividual.dateKey,
                timeLocal: huecoIndividual.timeLocal,
              },
              notaInterna: notaInterna.trim() || undefined,
            }
          : esGrupal && !agregarEvaluacionGrupal && Boolean(horarioGrupal)
            ? {
                nombre,
                mail,
                celular,
                motivo,
                modalidad,
                horario: horarioGrupal,
                notaInterna: notaInterna.trim() || undefined,
              }
            : esGrupal && agregarEvaluacionGrupal && Boolean(horarioGrupal) && huecoEvalGrupal
            ? {
                nombre,
                mail,
                celular,
                motivo,
                modalidad,
                horario: horarioGrupal,
                horarioEvaluacion: huecoEvalGrupal.templateId,
                formatoEvaluacion,
                evalSlot: {
                  dateKey: huecoEvalGrupal.dateKey,
                  timeLocal: huecoEvalGrupal.timeLocal,
                },
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
      router.push("/panel-turnos?creado=1");
      router.refresh();
    } catch {
      setMsg("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel-light-theme rounded-[28px] border border-black/10 bg-[var(--panel-surface)] p-5 shadow-[0_14px_32px_rgba(17,24,39,0.14)]">
      <h1 className="text-lg font-semibold text-[var(--brand-cream)]/95">Nuevo turno manual</h1>
      <p className="mt-1 text-xs text-[var(--brand-cream)]/60">Alta directa sin pago (confirmado en el momento).</p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido" className="w-full rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none" />
        {fieldErrors.nombre ? <p className="text-xs text-red-700">{fieldErrors.nombre}</p> : null}
        <input value={mail} onChange={(e) => setMail(e.target.value)} placeholder="Mail (opcional)" type="email" className="w-full rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none" />
        {fieldErrors.mail ? <p className="text-xs text-red-700">{fieldErrors.mail}</p> : null}
        <input value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="Celular" className="w-full rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none" />
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
              setHuecoIndividual(null);
              setHuecoEvalGrupal(null);
              setHorarioGrupal("");
              setAgregarEvaluacionGrupal(false);
              setFormatoConsulta("");
              setFormatoEvaluacion("");
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
              <ReservaHuecosCalendario
                mode="individual"
                accentColor="#4F7CAC"
                titulo="Elegí día y horario"
                onSeleccion={(h) => setHuecoIndividual(h)}
              />
            )}
            {fieldErrors.principalSlot ? <p className="text-xs text-red-700">{fieldErrors.principalSlot}</p> : null}
          </>
        )}

        {esGrupal && (
          <>
            <div className="relative">
              <select value={horarioGrupal} onChange={(e) => {
                setHorarioGrupal(e.target.value);
                setHuecoEvalGrupal(null);
              }} disabled={horariosGrupalLoading || opcionesGrupalDisponibles.length === 0} className={`w-full appearance-none rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none disabled:opacity-60 ${horarioGrupal ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"}`}>
                <option value="" disabled hidden>
                  {horariosGrupalLoading ? "Cargando franjas..." : "Elegir franja grupal"}
                </option>
                {opcionesGrupalDisponibles.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
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
            <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2.5">
              <input
                type="checkbox"
                checked={agregarEvaluacionGrupal}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAgregarEvaluacionGrupal(checked);
                  if (!checked) {
                    setFormatoEvaluacion("");
                    setHuecoEvalGrupal(null);
                  }
                }}
                className="mt-0.5 h-4 w-4 rounded border-black/20 accent-[var(--brand-ui-primary)]"
              />
              <span className="text-sm text-[var(--brand-cream)]/85">
                Agregar evaluación individual (opcional)
              </span>
            </label>
            {agregarEvaluacionGrupal && (
              <>
                <div className="relative">
                  <select value={formatoEvaluacion} onChange={(e) => setFormatoEvaluacion(e.target.value as "presencial" | "virtual" | "")} className={`w-full appearance-none rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none ${formatoEvaluacion ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"}`}>
                    <option value="" disabled hidden>Formato de evaluación</option>
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-cream)]/65">
                    {iconChevronDown}
                  </span>
                </div>
                {fieldErrors.formatoEvaluacion ? <p className="text-xs text-red-700">{fieldErrors.formatoEvaluacion}</p> : null}
                {horarioGrupal && (formatoEvaluacion === "presencial" || formatoEvaluacion === "virtual") && (
                  <div ref={evalCalendarWrapRef}>
                    <ReservaHuecosCalendario
                      mode="grupal-eval"
                      horarioGrupalId={horarioGrupal}
                      accentColor="#4F7CAC"
                      titulo="Elegí evaluación"
                      onSeleccion={(h) => setHuecoEvalGrupal(h)}
                    />
                  </div>
                )}
                {fieldErrors.evalSlot ? <p className="text-xs text-red-700">{fieldErrors.evalSlot}</p> : null}
              </>
            )}
          </>
        )}

        <textarea
          value={notaInterna}
          onChange={(e) => setNotaInterna(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Nota interna (opcional)"
          className="max-h-32 w-full resize-y overflow-y-auto rounded-xl border border-black/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none"
        />

        {msg && <p className="text-sm text-red-700">{msg}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-[var(--brand-ui-primary)] py-3 text-sm font-semibold text-[var(--color-primary-contrast)] disabled:opacity-50"
        >
          {busy ? "Guardando..." : "Crear turno confirmado"}
        </button>
      </form>
    </section>
  );
}
