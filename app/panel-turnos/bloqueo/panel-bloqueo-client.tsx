"use client";

import { useState } from "react";

export function PanelBloqueoClient() {
  const [anchorDateKey, setAnchorDateKey] = useState("");
  const [timeLocal, setTimeLocal] = useState("09:00");
  const [recurrenceType, setRecurrenceType] = useState<"once" | "weekly">("once");
  const [untilDateKey, setUntilDateKey] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/panel-turnos/agenda-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anchorDateKey,
          timeLocal,
          durationMinutes: 60,
          recurrenceType,
          untilDateKey: recurrenceType === "weekly" && untilDateKey ? untilDateKey : null,
          notes: notes.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "No se pudo guardar.");
        return;
      }
      setMsg("Bloqueo creado.");
      setNotes("");
    } catch {
      setMsg("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-[var(--panel-surface)] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
      <h1 className="text-lg font-semibold text-[var(--brand-accent-v1)]">Bloquear agenda</h1>
      <p className="mt-1 text-xs leading-relaxed text-[var(--brand-cream)]/55">
        Marcá una franja como no disponible para reservas web (misma lógica que un turno ocupado).
      </p>
      <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="text-xs font-medium text-[var(--brand-cream)]/70">
          Fecha (AAAA-MM-DD)
          <input
            required
            value={anchorDateKey}
            onChange={(e) => setAnchorDateKey(e.target.value.trim())}
            className="mt-1 w-full rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none focus:border-[var(--brand-ui-primary)]"
            placeholder="2026-04-22"
          />
        </label>
        <label className="text-xs font-medium text-[var(--brand-cream)]/70">
          Hora local (HH:mm)
          <input
            required
            value={timeLocal}
            onChange={(e) => setTimeLocal(e.target.value.trim())}
            className="mt-1 w-full rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none focus:border-[var(--brand-ui-primary)]"
          />
        </label>
        <label className="text-xs font-medium text-[var(--brand-cream)]/70">
          Repetición
          <select
            value={recurrenceType}
            onChange={(e) => setRecurrenceType(e.target.value as "once" | "weekly")}
            className="mt-1 w-full rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none"
          >
            <option value="once">Una vez</option>
            <option value="weekly">Semanal</option>
          </select>
        </label>
        {recurrenceType === "weekly" && (
          <label className="text-xs font-medium text-[var(--brand-cream)]/70">
            Hasta (AAAA-MM-DD, opcional)
            <input
              value={untilDateKey}
              onChange={(e) => setUntilDateKey(e.target.value.trim())}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none"
            />
          </label>
        )}
        <label className="text-xs font-medium text-[var(--brand-cream)]/70">
          Nota interna
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-none rounded-xl border border-white/15 bg-[var(--panel-input)] px-3 py-2 text-sm text-[var(--brand-cream)] outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-2xl bg-gradient-to-br from-[var(--brand-ui-primary)] to-[var(--brand-accent-v1)] py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Crear bloqueo"}
        </button>
        {msg && <p className="text-center text-xs text-[var(--brand-cream)]/80">{msg}</p>}
      </form>
    </section>
  );
}
