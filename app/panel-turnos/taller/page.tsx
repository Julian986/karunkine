import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { panelContainer, panelPage, panelPageBg } from "../../../components/panel/panel-ui";
import { isPanelAuthenticated } from "../../../lib/panel-auth";
import { PanelTallerInscripcionesClient } from "./panel-taller-inscripciones-client";

export const metadata: Metadata = {
  title: "Inscriptos al taller | Karün",
};

export default async function PanelTallerInscripcionesPage() {
  if (!(await isPanelAuthenticated())) {
    redirect("/panel-turnos/login");
  }

  return (
    <main className={`${panelPage} ${panelPageBg}`}>
      <div className={`${panelContainer} pt-6 pb-8`}>
        <PanelTallerInscripcionesClient />
      </div>
    </main>
  );
}
