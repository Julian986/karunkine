"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

const PENDING_KEY = "karunkine_pending_reserva_id";

/** Fondo de marca suave alrededor de la tarjeta (coherente con la home) */
const BRAND_PAGE_BG =
  "min-h-[calc(100dvh-5rem)] bg-gradient-to-b from-[#8b3014] via-[#963417] to-[#7a2810] px-4 py-10 sm:py-14";

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

  const tituloAccent =
    estadoUrl === "failure"
      ? "text-red-800"
      : estadoUrl === "pending"
        ? "text-amber-900"
        : pollEstado === "confirmado"
          ? "text-emerald-800"
          : "text-zinc-900";

  return (
    <main className={BRAND_PAGE_BG}>
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl bg-white px-6 py-10 shadow-[0_20px_50px_rgba(0,0,0,0.22)] sm:px-8 sm:py-12">
          <h1 className={`text-center text-2xl font-bold tracking-tight sm:text-[1.65rem] ${tituloAccent}`}>
            {titulo}
          </h1>

          <div className="mt-5 space-y-4 text-center text-base leading-relaxed text-zinc-600">
            {estadoUrl === "success" && pollEstado !== "confirmado" && (
              <p>
                Si Mercado Pago aprobó el pago, tu reserva quedará confirmada en segundos.{" "}
                <span className="font-medium text-zinc-700">Esta pantalla no confirma el pago por sí sola.</span>
              </p>
            )}
            {estadoUrl === "success" && pollEstado === "confirmado" && (
              <p className="text-zinc-700">
                Tu reserva está <strong className="text-emerald-800">confirmada</strong>. Te contactaremos con
                los detalles. Recordá asistir con ropa cómoda o deportiva.
              </p>
            )}
            {estadoUrl === "failure" && (
              <p>Podés volver al formulario e intentar de nuevo cuando quieras.</p>
            )}
            {estadoUrl === "pending" && (
              <p>Tu medio de pago puede tardar unos minutos. Te avisaremos cuando se acredite.</p>
            )}
            {!["success", "failure", "pending"].includes(estadoUrl) && (
              <p>Volvé al inicio o al formulario de reserva.</p>
            )}
          </div>

          {pollError && (
            <p
              className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-950"
              role="status"
            >
              {pollError}
            </p>
          )}

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/#formulario-reserva"
              className="inline-flex w-full max-w-xs items-center justify-center rounded-xl bg-[#963417] px-6 py-3.5 text-center text-base font-semibold text-white shadow-md transition hover:bg-[#7a2d16] hover:shadow-lg active:scale-[0.99] sm:w-auto sm:min-w-[220px]"
            >
              Volver al formulario
            </Link>
          </div>

          <p className="mt-8 border-t border-zinc-100 pt-6 text-center text-xs leading-relaxed text-zinc-500">
            La confirmación oficial la envía Mercado Pago al servidor (webhook); no depende de esta página.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ReservaResultadoPage() {
  return (
    <Suspense
      fallback={
        <main className={BRAND_PAGE_BG}>
          <div className="mx-auto max-w-md rounded-2xl bg-white/95 px-6 py-12 text-center text-zinc-500 shadow-xl">
            Cargando…
          </div>
        </main>
      }
    >
      <ResultadoContent />
    </Suspense>
  );
}
