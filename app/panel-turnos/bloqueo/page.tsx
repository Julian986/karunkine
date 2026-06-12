import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { panelBackLink, panelContainer, panelPage, panelPageBg } from "../../../components/panel/panel-ui";
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
    <main className={`${panelPage} ${panelPageBg}`}>
      <div className={`${panelContainer} pt-6`}>
        <Link href="/panel-turnos" className={panelBackLink}>
          ← Volver al panel
        </Link>
        <PanelBloqueoClient />
      </div>
    </main>
  );
}
