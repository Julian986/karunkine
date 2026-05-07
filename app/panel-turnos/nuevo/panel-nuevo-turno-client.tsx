"use client";

import { useEffect, useMemo, useState } from "react";
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
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
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "No se pudo crear el turno.");
        return;
      }
      router.push("/panel-turnos");
      router.refresh();
    } catch {
      setMsg("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-[var(--panel-surface)] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
      <h1 className="text-lg font-semibold text-[var(--brand-accent-v1)]">Nuevo turno manual</h1>
      <p className="mt-1 text-xs text-[var(--brand-cream)]/60">Alta directa sin pago (confirmado en el momento).</p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido" className="w-full rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none" />
        <input value={mail} onChange={(e) => setMail(e.target.value)} placeholder="Mail" type="email" className="w-full rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none" />
        <input value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="Celular" className="w-full rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none" />
        <div className="relative">
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className={`w-full appearance-none rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none ${
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
            className={`w-full appearance-none rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none ${
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

        {esIndividual && (
          <>
            <div className="relative">
              <select value={formatoConsulta} onChange={(e) => setFormatoConsulta(e.target.value as "presencial" | "virtual" | "")} className={`w-full appearance-none rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none ${formatoConsulta ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"}`}>
                <option value="" disabled hidden>Formato de consulta</option>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-cream)]/65">
                {iconChevronDown}
              </span>
            </div>
            {(formatoConsulta === "presencial" || formatoConsulta === "virtual") && (
              <ReservaHuecosCalendario
                mode="individual"
                accentColor="#D3A24C"
                titulo="Elegí día y horario"
                onSeleccion={(h) => setHuecoIndividual(h)}
              />
            )}
          </>
        )}

        {esGrupal && (
          <>
            <div className="relative">
              <select value={horarioGrupal} onChange={(e) => {
                setHorarioGrupal(e.target.value);
                setHuecoEvalGrupal(null);
              }} disabled={horariosGrupalLoading || opcionesGrupalDisponibles.length === 0} className={`w-full appearance-none rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none disabled:opacity-60 ${horarioGrupal ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"}`}>
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
            {!horariosGrupalLoading && opcionesGrupalDisponibles.length === 0 && (
              <p className="text-xs text-[var(--brand-cream)]/60">
                No hay franjas grupales disponibles en este momento.
              </p>
            )}
            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/15 px-3 py-2.5">
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
                className="mt-0.5 h-4 w-4 rounded border-white/20 accent-[var(--brand-ui-primary)]"
              />
              <span className="text-sm text-[var(--brand-cream)]/85">
                Agregar evaluación individual (opcional)
              </span>
            </label>
            {agregarEvaluacionGrupal && (
              <>
                <div className="relative">
                  <select value={formatoEvaluacion} onChange={(e) => setFormatoEvaluacion(e.target.value as "presencial" | "virtual" | "")} className={`w-full appearance-none rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 pr-10 text-sm outline-none ${formatoEvaluacion ? "text-[var(--brand-cream)]" : "text-[var(--brand-cream)]/55"}`}>
                    <option value="" disabled hidden>Formato de evaluación</option>
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-cream)]/65">
                    {iconChevronDown}
                  </span>
                </div>
                {horarioGrupal && (formatoEvaluacion === "presencial" || formatoEvaluacion === "virtual") && (
                  <ReservaHuecosCalendario
                    mode="grupal-eval"
                    horarioGrupalId={horarioGrupal}
                    accentColor="#D3A24C"
                    titulo="Elegí evaluación"
                    onSeleccion={(h) => setHuecoEvalGrupal(h)}
                  />
                )}
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
          className="max-h-32 w-full resize-y overflow-y-auto rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none"
        />

        {msg && <p className="text-sm text-red-300">{msg}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-gradient-to-br from-[var(--brand-ui-primary)] to-[var(--brand-accent-v1)] py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Guardando..." : "Crear turno confirmado"}
        </button>
      </form>
    </section>
  );
}
