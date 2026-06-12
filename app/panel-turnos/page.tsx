import { redirect } from "next/navigation";
import { Suspense } from "react";

import { isPanelAuthenticated } from "../../lib/panel-auth";
import { PanelTurnosDashboard } from "./panel-turnos-dashboard";

export default async function PanelTurnosPage() {
  if (!(await isPanelAuthenticated())) {
    redirect("/panel-turnos/login");
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0F1F3] pb-24 pt-8 text-center text-sm text-gray-500">Cargando agenda…</div>}>
      <PanelTurnosDashboard />
    </Suspense>
  );
}
