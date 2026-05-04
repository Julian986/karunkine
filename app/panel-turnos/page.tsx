import { redirect } from "next/navigation";
import { Suspense } from "react";

import { isPanelAuthenticated } from "../../lib/panel-auth";
import { PanelTurnosDashboard } from "./panel-turnos-dashboard";

export default async function PanelTurnosPage() {
  if (!(await isPanelAuthenticated())) {
    redirect("/panel-turnos/login");
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--panel-bg)] pb-24 pt-8 text-center text-sm text-[var(--brand-cream)]/70">Cargando agenda…</div>}>
      <PanelTurnosDashboard />
    </Suspense>
  );
}
