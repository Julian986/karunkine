import type { Metadata } from "next";
import { Suspense } from "react";
import { MisTurnosClient } from "./mis-turnos-client";

export const metadata: Metadata = {
  title: "Mi perfil",
  description: "Consultá tus turnos e inscripciones al taller con Karunkine.",
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
