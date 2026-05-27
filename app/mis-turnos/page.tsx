import type { Metadata } from "next";
import { Suspense } from "react";
import { MisTurnosClient } from "./mis-turnos-client";

export const metadata: Metadata = {
  title: "Mis turnos",
  description: "Consultá, cancelá o reprogramá tus turnos con Karunkine.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MisTurnosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#faf6f3] text-sm text-zinc-500">
          Cargando…
        </div>
      }
    >
      <MisTurnosClient />
    </Suspense>
  );
}
