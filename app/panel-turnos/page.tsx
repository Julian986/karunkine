import { redirect } from "next/navigation";

import { isPanelAuthenticated } from "../../lib/panel-auth";
import { PanelTurnosDashboard } from "./panel-turnos-dashboard";

export default async function PanelTurnosPage() {
  if (!(await isPanelAuthenticated())) {
    redirect("/panel-turnos/login");
  }

  return <PanelTurnosDashboard />;
}
