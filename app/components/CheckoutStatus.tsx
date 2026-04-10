"use client";

import { useEffect, useRef, useState } from "react";
import { mensajeConfirmacionReserva } from "../../lib/reserva/mensaje-confirmacion";

type Status = "success" | "pending" | "failure";

const PENDING_KEY = "karunkine_pending_reserva_id";

function SuccessIcon() {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20" fill="none" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke="#963417"
        strokeWidth="4"
        className="icon-circle-path"
      />
      <polyline
        points="30,52 44,66 70,36"
        stroke="#963417"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="icon-check-path"
      />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg viewBox="0 0 100 100" className="icon-pulse h-20 w-20" fill="none" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke="#b07a18"
        strokeWidth="4"
        strokeDasharray="8 5"
        strokeLinecap="round"
      />
      <circle cx="36" cy="50" r="4.5" fill="#b07a18" />
      <circle cx="50" cy="50" r="4.5" fill="#b07a18" />
      <circle cx="64" cy="50" r="4.5" fill="#b07a18" />
    </svg>
  );
}

function FailureIcon() {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20" fill="none" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke="#8b3a2e"
        strokeWidth="4"
        className="icon-circle-path"
      />
      <line
        x1="34"
        y1="34"
        x2="66"
        y2="66"
        stroke="#8b3a2e"
        strokeWidth="5"
        strokeLinecap="round"
        className="icon-x-path"
      />
      <line
        x1="66"
        y1="34"
        x2="34"
        y2="66"
        stroke="#8b3a2e"
        strokeWidth="5"
        strokeLinecap="round"
        className="icon-x-path"
      />
    </svg>
  );
}

const CONFIG = {
  success: {
    Icon: SuccessIcon,
    accentBg: "bg-[#f5ede7]",
    accentBorder: "border-[#d4977b]",
    accentText: "text-[#963417]",
    heading: "Gracias por tu pago",
    body: "Tu solicitud fue recibida. Si Mercado Pago aprobó el pago, tu reserva quedará confirmada en breve — te escribiremos por whatsapp con todos los detalles.",
    bodyConfirmed:
      "Tu reserva está confirmada. Te escribiremos con los detalles. Recordá usar ropa cómoda/deportiva.",
    ctaLabel: "Volver al inicio",
    ctaHref: "/",
    note: "La confirmación definitiva de tu turno la realiza nuestro sistema al recibir la notificación de pago. Esta pantalla no reemplaza esa validación.",
  },
  pending: {
    Icon: PendingIcon,
    accentBg: "bg-[#fdf6e7]",
    accentBorder: "border-[#c9a44a]",
    accentText: "text-[#7a5c12]",
    heading: "Pago en proceso",
    body: "Algunos medios de pago pueden tardar unas horas en confirmarse. No hace falta hacer nada por ahora — en cuanto tengamos novedades te avisamos por whatsapp.",
    bodyConfirmed: null,
    ctaLabel: "Volver al inicio",
    ctaHref: "/",
    note: "Si tu pago demora más de 48 horas sin confirmarse, podés escribirnos y lo revisamos juntos.",
  },
  failure: {
    Icon: FailureIcon,
    accentBg: "bg-[#f9eded]",
    accentBorder: "border-[#c07070]",
    accentText: "text-[#7a2c2c]",
    heading: "El pago no se completó",
    body: "No se pudo procesar tu pago en esta ocasión. Puede deberse a un límite de tarjeta, saldo insuficiente o un corte momentáneo. Podés intentarlo de nuevo cuando quieras — no te generó ningún cargo.",
    bodyConfirmed: null,
    ctaLabel: "Volver e intentar de nuevo",
    ctaHref: "/#formulario-reserva",
    note: "Si el inconveniente persiste, no dudes en escribirnos y buscamos otra forma de ayudarte.",
  },
} as const;

function isStatus(s: string | undefined): s is Status {
  return s === "success" || s === "pending" || s === "failure";
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-4 pb-10 pt-20 sm:pb-12 sm:pt-24 md:pt-28"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% 0%, hsl(20 30% 90%) 0%, hsl(36 30% 96%) 60%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <svg
          className="absolute -left-24 -top-24 h-[520px] w-[520px] opacity-[0.06]"
          viewBox="0 0 520 520"
          fill="none"
        >
          <ellipse cx="260" cy="260" rx="240" ry="180" stroke="#963417" strokeWidth="1.5" />
          <ellipse cx="260" cy="260" rx="180" ry="120" stroke="#963417" strokeWidth="1" />
          <ellipse cx="260" cy="260" rx="120" ry="70" stroke="#963417" strokeWidth="0.8" />
        </svg>
        <svg
          className="absolute -bottom-20 -right-16 h-[400px] w-[400px] opacity-[0.05]"
          viewBox="0 0 400 400"
          fill="none"
        >
          <ellipse cx="200" cy="200" rx="180" ry="140" stroke="#963417" strokeWidth="1.5" />
          <ellipse cx="200" cy="200" rx="120" ry="90" stroke="#963417" strokeWidth="1" />
        </svg>
      </div>
      {children}
      <p className="animate-fade-up animate-delay-400 relative z-10 mt-8 text-center text-xs text-stone-400">
        Karunkine &nbsp;·&nbsp; Wanda Perrin &nbsp;·&nbsp; Bahía Blanca
      </p>
    </div>
  );
}

type EstadoPollJson = {
  estado?: string;
  modalidad?: string;
  turnoDetalle?: string;
};

export default function CheckoutStatus({ estado }: { estado?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pollEstado, setPollEstado] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [pollConfirmMeta, setPollConfirmMeta] = useState<{
    modalidad: string;
    turnoDetalle: string;
  } | null>(null);

  const status: Status | null = isStatus(estado) ? estado : null;

  useEffect(() => {
    cardRef.current?.focus();
  }, [status]);

  useEffect(() => {
    if (typeof window === "undefined" || status !== "success") return;
    const id = window.sessionStorage.getItem(PENDING_KEY);
    if (!id) return;

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
        setPollError(
          "Seguimos procesando tu pago. Si ya pagaste, en breve verás la reserva confirmada."
        );
        return;
      }
      attempts += 1;
      try {
        const r = await fetch(`/api/reservas/${id}/estado`, { cache: "no-store" });
        const j = (await r.json()) as EstadoPollJson;
        if (cancelled) return;
        if (j.estado === "confirmado") {
          setPollEstado("confirmado");
          setPollConfirmMeta({
            modalidad:
              j.modalidad === "consulta_individual" ? "consulta_individual" : "grupal",
            turnoDetalle: String(j.turnoDetalle ?? ""),
          });
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
  }, [status]);

  if (!status) {
    return (
      <PageShell>
        <div
          ref={cardRef}
          tabIndex={-1}
          role="main"
          aria-label="Estado de pago"
          className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-stone-200 bg-white px-8 py-10 shadow-[0_8px_40px_rgba(80,40,20,0.12),0_2px_8px_rgba(80,40,20,0.07)] outline-none sm:px-10 sm:py-12"
        >
          <h1 className="text-center text-xl font-semibold text-stone-800">
            Enlace incompleto
          </h1>
          <p className="max-w-sm text-center text-[15px] leading-relaxed text-stone-600">
            Volvé desde Mercado Pago o usá el menú del sitio para continuar.
          </p>
          <a
            href="/"
            className="mt-2 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#963417] px-8 py-3.5 text-[15px] font-semibold tracking-wide text-[#fdf6f0] shadow-sm transition-colors duration-200 hover:bg-[#7e2c13] active:bg-[#6b2410] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#963417] sm:w-auto"
          >
            Ir al inicio
          </a>
        </div>
      </PageShell>
    );
  }

  const cfg = CONFIG[status];
  const Icon = cfg.Icon;
  const showConfirmed = status === "success" && pollEstado === "confirmado";
  const bodyText =
    showConfirmed && pollConfirmMeta
      ? mensajeConfirmacionReserva({
          modalidad: pollConfirmMeta.modalidad,
          turnoDetalle: pollConfirmMeta.turnoDetalle,
        })
      : showConfirmed && cfg.bodyConfirmed
        ? cfg.bodyConfirmed
        : cfg.body;

  return (
    <PageShell>
      <div
        ref={cardRef}
        tabIndex={-1}
        role="main"
        aria-label={cfg.heading}
        className={`animate-scale-in relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border ${cfg.accentBorder} bg-white px-8 py-10 shadow-[0_8px_40px_rgba(80,40,20,0.12),0_2px_8px_rgba(80,40,20,0.07)] outline-none sm:px-10 sm:py-12`}
      >
        <div className="animate-fade-up animate-delay-100">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#963417] opacity-80">
            Karün · Conciencia corporal
          </p>
        </div>
        <div aria-hidden="true" className="h-px w-10 bg-[#d4977b] opacity-50" />
        <div
          aria-hidden="true"
          className={`animate-fade-up animate-delay-200 flex h-28 w-28 items-center justify-center rounded-full ${cfg.accentBg}`}
        >
          <Icon />
        </div>
        <h1
          className={`animate-fade-up animate-delay-200 text-center text-2xl font-semibold leading-snug tracking-tight sm:text-3xl ${cfg.accentText}`}
        >
          {cfg.heading}
        </h1>
        <p className="animate-fade-up animate-delay-300 max-w-sm whitespace-pre-line text-center text-[15px] leading-relaxed text-stone-600 sm:text-base">
          {bodyText}
        </p>
        {pollError && status === "success" && (
          <p
            className="animate-fade-up animate-delay-300 max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-950"
            role="status"
          >
            {pollError}
          </p>
        )}
        <a
          href={cfg.ctaHref}
          className="animate-fade-up animate-delay-300 mt-2 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#963417] px-8 py-3.5 text-[15px] font-semibold tracking-wide text-[#fdf6f0] shadow-sm transition-colors duration-200 hover:bg-[#7e2c13] active:bg-[#6b2410] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#963417] sm:w-auto"
        >
          {cfg.ctaLabel}
        </a>
        <p className="animate-fade-up animate-delay-400 mt-1 max-w-xs text-center text-xs leading-relaxed text-stone-400">
          {cfg.note}
        </p>
      </div>
    </PageShell>
  );
}
