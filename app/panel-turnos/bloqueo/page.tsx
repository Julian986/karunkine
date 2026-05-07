import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isPanelAuthenticated } from "../../../lib/panel-auth";
import { PanelBloqueoClient } from "./panel-bloqueo-client";

export const metadata: Metadata = {
  title: "Bloqueo de agenda | Karün",
};

export default async function PanelBloqueoPage() {
  if (!(await isPanelAuthenticated())) {
    redirect("/panel-turnos/login");
  }

  return (
    <main className="panel-light-theme min-h-screen bg-[var(--panel-page-bg)] px-4 pb-24 pt-6 text-[var(--brand-cream)]">
      <div className="mx-auto max-w-md">
        <Link
          href="/panel-turnos"
          className="mb-4 inline-flex items-center rounded-xl border border-black/10 bg-[var(--panel-surface)] px-3 py-2 text-sm text-[var(--brand-cream)]/90 hover:bg-[var(--panel-surface-hover)]"
        >
          ← Volver al panel
        </Link>
        <PanelBloqueoClient />
      </div>
    </main>
  );
}
