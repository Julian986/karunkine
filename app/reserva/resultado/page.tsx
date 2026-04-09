"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

const PENDING_KEY = "karunkine_pending_reserva_id";

function ResultadoContent() {
  const searchParams = useSearchParams();
  const estadoUrl = searchParams.get("estado") ?? "";
  const [pollEstado, setPollEstado] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.sessionStorage.getItem(PENDING_KEY);
    if (!id || estadoUrl !== "success") {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 24;

    const schedule = () => {
      window.setTimeout(() => {
        void tick();
      }, 2500);
    };

    const tick = async () => {
      if (cancelled) return;
      if (attempts >= maxAttempts) {
        setPollError("Seguimos procesando tu pago. Si ya pagaste, en breve verás la reserva confirmada.");
        return;
      }
      attempts += 1;
      try {
        const r = await fetch(`/api/reservas/${id}/estado`, { cache: "no-store" });
        const j = (await r.json()) as { estado?: string };
        if (cancelled) return;
        if (j.estado === "confirmado") {
          setPollEstado("confirmado");
          window.sessionStorage.removeItem(PENDING_KEY);
          return;
        }
        if (j.estado === "expirado" || j.estado === "cancelado") {
          setPollEstado(j.estado);
          window.sessionStorage.removeItem(PENDING_KEY);
          return;
        }
      } catch {
        if (!cancelled) setPollError("No pudimos consultar el estado. Podés revisar más tarde.");
        return;
      }
      if (!cancelled && attempts < maxAttempts) schedule();
    };

    void tick();
    return () => {
      cancelled = true;
    };
  }, [estadoUrl]);

  const titulo =
    estadoUrl === "success"
      ? "Gracias por tu pago"
      : estadoUrl === "failure"
        ? "No se completó el pago"
        : estadoUrl === "pending"
          ? "Pago pendiente"
          : "Reserva";

  return (
    <main className="mx-auto min-h-[60vh] max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">{titulo}</h1>
      <p className="mt-4 text-zinc-600">
        {estadoUrl === "success" && pollEstado !== "confirmado" && (
          <>
            Si Mercado Pago aprobó el pago, tu reserva quedará confirmada en segundos. Esta pantalla no
            confirma el pago por sí sola.
          </>
        )}
        {estadoUrl === "success" && pollEstado === "confirmado" && (
          <>
            Tu reserva está <strong>confirmada</strong>. Te contactaremos con los detalles. Recordá asistir
            con ropa cómoda o deportiva.
          </>
        )}
        {estadoUrl === "failure" && <>Podés volver al formulario e intentar de nuevo cuando quieras.</>}
        {estadoUrl === "pending" && (
          <>Tu medio de pago puede tardar unos minutos. Te avisaremos cuando se acredite.</>
        )}
        {!["success", "failure", "pending"].includes(estadoUrl) && (
          <>Volvé al inicio o al formulario de reserva.</>
        )}
      </p>
      {pollError && (
        <p className="mt-4 text-sm text-amber-800" role="status">
          {pollError}
        </p>
      )}
      <Link
        href="/#formulario-reserva"
        className="mt-8 inline-block rounded-xl bg-[#963417] px-6 py-3 font-semibold text-white hover:opacity-90"
      >
        Volver al formulario
      </Link>
      <p className="mt-6 text-xs text-zinc-400">
        La confirmación oficial la envía Mercado Pago al servidor (webhook); no depende de esta página.
      </p>
    </main>
  );
}

export default function ReservaResultadoPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-16 text-center text-zinc-500">Cargando…</main>
      }
    >
      <ResultadoContent />
    </Suspense>
  );
}
