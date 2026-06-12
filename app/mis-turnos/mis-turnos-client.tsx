"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { isLikelyWhatsappNumber } from "../../lib/customer/phone";
import {
  customerTallerInscripcionEstadoLabel,
  type CustomerTallerInscripcionPublic,
} from "../../lib/taller/customer-inscripciones";
import {
  isUpcomingTurno,
  type CustomerTurnoPublic,
} from "../../lib/turnos/customer-turnos-public";
import { utcTodayDateKey } from "../../lib/turnos/wanda-schedule";

function estadoLabel(estado: string): string {
  switch (estado) {
    case "confirmado":
      return "Confirmado";
    case "pending_payment":
      return "Pago pendiente";
    case "pendiente":
      return "Pendiente";
    case "contactado":
      return "Contactado";
    case "cancelado":
      return "Cancelado";
    case "expirado":
      return "Expirado";
    default:
      return estado;
  }
}

function estadoBadgeStyles(estado: string): string {
  switch (estado) {
    case "confirmado":
      return "bg-emerald-100 text-emerald-950 ring-1 ring-emerald-200/80";
    case "pending_payment":
      return "bg-amber-100 text-amber-950 ring-1 ring-amber-200/80";
    case "pendiente":
    case "contactado":
      return "bg-sky-100 text-sky-950 ring-1 ring-sky-200/80";
    case "cancelado":
      return "bg-zinc-200 text-zinc-800 ring-1 ring-zinc-300/80";
    case "expirado":
      return "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80";
    default:
      return "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200/80";
  }
}

function tallerEstadoBadgeStyles(estado: string): string {
  switch (estado) {
    case "confirmado":
      return "bg-emerald-100 text-emerald-950 ring-1 ring-emerald-200/80";
    case "pending_payment":
      return "bg-amber-100 text-amber-950 ring-1 ring-amber-200/80";
    case "expirado":
      return "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80";
    default:
      return "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200/80";
  }
}

export function MisTurnosClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<CustomerTurnoPublic[] | null>(null);
  const [inscripciones, setInscripciones] = useState<CustomerTallerInscripcionPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  const todayKey = useMemo(() => utcTodayDateKey(), []);

  const loadTurnos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mis-turnos/turnos", { credentials: "same-origin" });
      if (res.status === 401) {
        setAuthed(false);
        setRows([]);
        return;
      }
      const data = (await res.json()) as {
        turnos?: CustomerTurnoPublic[];
        inscripciones?: CustomerTallerInscripcionPublic[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "No se pudieron cargar tus datos.");
        setRows([]);
        setInscripciones([]);
        return;
      }
      setAuthed(true);
      setRows(data.turnos ?? []);
      setInscripciones(Array.isArray(data.inscripciones) ? data.inscripciones : []);
    } catch {
      setError("Sin conexión.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTurnos();
  }, [loadTurnos]);

  useEffect(() => {
    if (searchParams.get("reprogramado") !== "1") return;
    router.replace("/mis-turnos", { scroll: false });
    setSuccessMessage("Turno reprogramado con éxito.");
    void loadTurnos();
  }, [searchParams, router, loadTurnos]);

  useEffect(() => {
    if (!successMessage) return;
    const t = window.setTimeout(() => setSuccessMessage(null), 4500);
    return () => window.clearTimeout(t);
  }, [successMessage]);

  const upcoming = useMemo(
    () => (rows ?? []).filter((r) => isUpcomingTurno(r, todayKey)).sort((a, b) => a.displayStartsAt.localeCompare(b.displayStartsAt)),
    [rows, todayKey],
  );
  const past = useMemo(
    () => (rows ?? []).filter((r) => !isUpcomingTurno(r, todayKey)).sort((a, b) => b.displayStartsAt.localeCompare(a.displayStartsAt)),
    [rows, todayKey],
  );

  const list = tab === "upcoming" ? upcoming : past;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isLikelyWhatsappNumber(phoneInput)) {
      setError("Ingresá un WhatsApp válido (10 a 15 dígitos).");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/mis-turnos/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      setPhoneInput("");
      await loadTurnos();
    } catch {
      setError("Sin conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch("/api/mis-turnos/session", { method: "DELETE", credentials: "same-origin" });
      setAuthed(false);
      setRows([]);
      setInscripciones([]);
    } finally {
      setBusy(false);
    }
  }

  const handleCancelReservation = useCallback(
    async (turnoId: string) => {
      setCancellingId(turnoId);
      setError(null);
      setSuccessMessage(null);
      try {
        const res = await fetch(`/api/mis-turnos/turnos/${encodeURIComponent(turnoId)}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "No se pudo cancelar el turno.");
          return;
        }
        await loadTurnos();
        setSuccessMessage("Turno cancelado con éxito.");
      } catch {
        setError("Sin conexión.");
      } finally {
        setCancellingId(null);
      }
    },
    [loadTurnos],
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#faf6f3] to-[#f0e8e2] px-4 pb-24 pt-8 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-8">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-4 text-sm font-semibold text-[#963417] shadow-sm transition hover:border-[#963417]/40 hover:bg-[#963417]/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#963417]"
          >
            <span aria-hidden className="text-base leading-none opacity-90">
              ←
            </span>
            Inicio
          </Link>
          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-zinc-900">Mi perfil</h1>
          {!authed ? (
            <p className="mt-2 text-base text-zinc-600">Entrá con tu WhatsApp para ver tus turnos e inscripciones.</p>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">Tus turnos e inscripciones al taller.</p>
          )}
        </header>

        {!authed && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-md shadow-zinc-900/5">
            <div className="border-b border-zinc-100 bg-gradient-to-r from-[#963417]/8 to-transparent px-5 py-4">
              <h2 className="text-lg font-semibold text-zinc-900">Entrá con tu número</h2>
              <p className="mt-0.5 text-sm text-zinc-500">Podés entrar aunque todavía no hayas reservado ni inscripto.</p>
            </div>
            <form onSubmit={(e) => void handleLogin(e)} className="space-y-4 p-5">
              <div>
                <label htmlFor="mis-turnos-phone" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  WhatsApp
                </label>
                <input
                  id="mis-turnos-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+54 9 11 …"
                  className="mt-2 w-full rounded-xl border-2 border-zinc-200 bg-zinc-50/50 px-4 py-3.5 text-lg font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#963417] focus:bg-white"
                />
              </div>
              {error && !authed ? (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#963417] text-base font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
              >
                {busy ? "…" : "Entrar a mi perfil"}
              </button>
            </form>
          </section>
        )}

        {authed && error ? (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-base font-medium text-amber-950"
          >
            {error}
          </p>
        ) : null}
        {authed && successMessage ? (
          <p
            role="status"
            className="mb-4 rounded-xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-base font-semibold text-emerald-950"
          >
            {successMessage}
          </p>
        ) : null}

        {authed && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-zinc-900">Turnos</h2>
            <div className="mb-5 flex gap-1 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => setTab("upcoming")}
                className={`flex-1 rounded-xl py-3 text-base font-semibold transition ${
                  tab === "upcoming" ? "bg-[#963417] text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                Próximos
                <span className={tab === "upcoming" ? "ml-1 opacity-90" : "ml-1 text-zinc-400"}>({upcoming.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("past")}
                className={`flex-1 rounded-xl py-3 text-base font-semibold transition ${
                  tab === "past" ? "bg-[#963417] text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                Pasados
                <span className={tab === "past" ? "ml-1 opacity-90" : "ml-1 text-zinc-400"}>({past.length})</span>
              </button>
            </div>

            {loading ? (
              <p className="py-12 text-center text-base font-medium text-zinc-500">Cargando tus turnos…</p>
            ) : null}

            {!loading && list.length === 0 ? (
              <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-zinc-300 bg-white/60 py-12 px-4 text-center">
                <p className="text-lg font-semibold text-zinc-800">
                  {tab === "upcoming" ? "No tenés turnos" : "No tenés turnos pasados"}
                </p>
                <p className="max-w-xs text-sm text-zinc-500">
                  {tab === "upcoming"
                    ? "Cuando reserves un turno, lo vas a ver acá."
                    : "Acá vas a ver el historial cuando tengas turnos anteriores."}
                </p>
                {tab === "upcoming" ? (
                  <Link
                    href="/#formulario-reserva"
                    className="inline-flex h-12 items-center rounded-2xl bg-[#963417] px-6 text-base font-semibold text-white shadow-md hover:opacity-95"
                  >
                    Reservar turno
                  </Link>
                ) : null}
              </div>
            ) : null}

            {!loading && list.length > 0 ? (
              <ul className="space-y-4">
                {list.map((r) => (
                  <li
                    key={r.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-md shadow-zinc-900/5"
                  >
                    <div className="border-b border-zinc-100 bg-gradient-to-br from-white to-zinc-50/80 px-4 pb-4 pt-5 sm:px-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        {tab === "upcoming" ? "Próxima actividad" : "Fecha del turno"}
                      </p>
                      <p className="mt-1 text-xl font-bold leading-snug text-zinc-900 sm:text-2xl">{r.displayFechaLine}</p>
                      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-[#963417] sm:text-[1.75rem]">
                        {r.displayHoraLine}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${estadoBadgeStyles(r.estado)}`}
                        >
                          {estadoLabel(r.estado)}
                        </span>
                        {r.modalidad === "grupal" ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-950 ring-1 ring-amber-200/80">
                            Plan grupal
                          </span>
                        ) : (
                          <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-950 ring-1 ring-violet-200/80">
                            Consulta individual
                          </span>
                        )}
                        {r.modalidad === "consulta_individual" && r.formatoConsulta ? (
                          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-800">
                            {r.formatoConsulta === "virtual" ? "Virtual" : "Presencial"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="px-4 py-4 sm:px-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Resumen</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{r.turnoDetalle}</p>
                      {r.modalidad === "grupal" && r.estado !== "cancelado" && r.estado !== "expirado" ? (
                        <p className="mt-3 rounded-lg bg-zinc-100/80 px-3 py-2 text-xs font-medium text-zinc-600">
                          Plan grupal: cambios por{" "}
                          <span className="font-semibold text-zinc-800">WhatsApp</span>.
                        </p>
                      ) : null}
                      {tab === "upcoming" && r.canCancel ? (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                          {r.canRescheduleIndividual ? (
                            <Link
                              href={`/mis-turnos/${encodeURIComponent(r.id)}/reprogramar`}
                              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border-2 border-[#963417] bg-[#963417] px-4 text-sm font-semibold text-white shadow-sm hover:opacity-95 sm:flex-none"
                            >
                              Cambiar horario
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            disabled={cancellingId === r.id}
                            onClick={() => setCancelConfirmId(r.id)}
                            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border-2 border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 sm:flex-none"
                          >
                            {cancellingId === r.id ? "Cancelando…" : "Cancelar turno"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        )}

        {authed && !loading ? (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-zinc-900">Inscripciones al taller</h2>
            {inscripciones.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-4 py-10 text-center">
                <p className="text-base font-semibold text-zinc-800">No tenés inscripciones al taller</p>
                <p className="mt-2 text-sm text-zinc-500">
                  Cuando te inscribas a un taller, vas a ver acá el estado de tu inscripción.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {inscripciones.map((ins) => (
                  <li
                    key={ins.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-md shadow-zinc-900/5"
                  >
                    <div className="px-4 py-5 sm:px-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Taller</p>
                      <p className="mt-1 text-xl font-bold leading-snug text-zinc-900">{ins.eventoTitulo}</p>
                      <p className="mt-1 text-base text-zinc-600">{ins.eventoFecha}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${tallerEstadoBadgeStyles(ins.estado)}`}
                        >
                          {customerTallerInscripcionEstadoLabel(ins.estado)}
                        </span>
                      </div>
                      <Link
                        href={`/${ins.eventoSlug}`}
                        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#963417]/20 bg-[#963417]/[0.06] px-4 text-sm font-semibold text-[#963417] hover:bg-[#963417]/10"
                      >
                        Ver detalles del taller
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {authed && (
          <div className="mt-8 flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white/80 px-4 py-3 shadow-sm">
            <span className="text-sm font-medium text-zinc-700">Sesión activa</span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={busy}
              className="text-sm font-semibold text-[#963417] underline-offset-2 hover:underline disabled:opacity-50"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {cancelConfirmId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => {
            if (cancellingId !== cancelConfirmId) setCancelConfirmId(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-zinc-900">¿Cancelar este turno?</h3>
            <p className="mt-3 text-base leading-relaxed text-zinc-600">
              Si ya pagaste, escribinos por WhatsApp antes de confirmar acá.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={() => setCancelConfirmId(null)}
                disabled={cancellingId === cancelConfirmId}
                className="h-11 rounded-xl border border-zinc-300 px-4 text-base font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                No, volver
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = cancelConfirmId;
                  if (!id) return;
                  await handleCancelReservation(id);
                  setCancelConfirmId(null);
                }}
                disabled={cancellingId === cancelConfirmId}
                className="h-11 rounded-xl bg-red-600 px-4 text-base font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancellingId === cancelConfirmId ? "Cancelando…" : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
