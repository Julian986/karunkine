import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isPanelAuthenticated } from "../../../lib/panel-auth";

export const metadata: Metadata = {
  title: "Nuevo turno | Karün",
};

export default async function PanelNuevoTurnoPage() {
  if (!(await isPanelAuthenticated())) {
    redirect("/panel-turnos/login");
  }

  return (
    <main className="min-h-screen bg-[var(--panel-bg)] px-4 pb-24 pt-6 text-[var(--brand-cream)]">
      <div className="mx-auto max-w-md">
        <Link
          href="/panel-turnos"
          className="mb-4 inline-flex items-center rounded-xl border border-white/10 bg-[var(--panel-surface)] px-3 py-2 text-sm text-[var(--brand-cream)]/90 hover:bg-[var(--panel-surface-hover)]"
        >
          ← Volver al panel
        </Link>
        <section className="rounded-[28px] border border-white/10 bg-[var(--panel-surface)] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
          <h1 className="text-lg font-semibold text-[var(--brand-accent-v1)]">Nuevo turno manual</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--brand-cream)]/65">
            El alta manual con validación de cupos en el mismo flujo que la web está en desarrollo.
            Por ahora podés registrar bloqueos de agenda o gestionar las reservas que entran por la web
            desde el calendario y la tabla del panel.
          </p>
        </section>
      </div>
    </main>
  );
}
