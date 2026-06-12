"use client";

import Image from "next/image";
import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import { useEffect, useLayoutEffect, useState } from "react";

import { scrollWindowToTop } from "../../lib/scroll-route";

import { MercadoPagoButton } from "../components/MercadoPagoButton";
import { ACCENT_LOGO_V1, hexToRgba } from "../components/LogoAccentContext";
import {
  iconComment,
  iconMail,
  iconPerson,
  iconPhone,
  ReservaFormInput,
} from "../components/ReservaFormInput";
import { event as gaEvent } from "../../lib/gtag";
import {
  formatPrecioArs,
  TALLER_BAHIA_JUNIO_2026,
  TALLER_FORM_FIELDS,
  type TallerEventoConfig,
} from "../../lib/taller/evento-config";
import { PENDING_TALLER_INSCRIPCION_ID_KEY } from "../../lib/taller/session";
import { crearTallerInscripcionSchema } from "../../lib/validators/taller-inscripcion";
import { altBandBg, BRAND_BG_LIGHT } from "../lib/brand-colors";

const tallerTituloFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600"],
});

type FormState = {
  nombre: string;
  mail: string;
  celular: string;
  comentario: string;
};

function CheckIcon() {
  return (
    <svg className="mt-1 h-5 w-5 shrink-0 text-[#963417]" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function InscribirmeArrowIcon() {
  return (
    <svg className="h-5 w-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}

function InscribirmeButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-[#963417] px-8 py-4 font-bold text-white shadow-lg transition-all hover:bg-[#7a2a12] active:scale-95 ${className}`}
    >
      <span>Inscribirme</span>
      <InscribirmeArrowIcon />
    </button>
  );
}

function FlyerHero({
  evento,
  onScrollToInscripcion,
}: {
  evento: TallerEventoConfig;
  onScrollToInscripcion: () => void;
}) {
  if (evento.imagenFlyerSrc) {
    return (
      <div className="relative w-full overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(61,32,16,0.18)]">
        <Image
          src={evento.imagenFlyerSrc}
          alt={`Flyer — ${evento.titulo}`}
          width={1080}
          height={1350}
          className="block h-auto w-full"
          priority
          sizes="(max-width: 768px) 100vw, 480px"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-[17%] flex justify-center px-4 sm:bottom-[28%]">
          <div className="pointer-events-auto rounded-full bg-gradient-to-t from-[#2a1812]/40 to-transparent p-1 pt-8">
            <InscribirmeButton onClick={onScrollToInscripcion} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex aspect-[4/5] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#c4933f]/45 bg-gradient-to-br from-[#f5ebe0] to-[#e8dcc8] px-6 text-center shadow-inner sm:aspect-[3/4]">
      <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#8a5a24]">Flyer</p>
      <div className="mt-6">
        <InscribirmeButton onClick={onScrollToInscripcion} />
      </div>
    </div>
  );
}

function TallerInfoSection({ evento }: { evento: TallerEventoConfig }) {
  const horarioDisplay = evento.horario.replace(/\s*h$/i, "H");

  return (
    <section className="bg-[#fff8f6] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="sr-only">
          {evento.titulo} — {evento.subtitulo}
        </h1>
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a0634a] sm:text-xs">
            {evento.subtitulo}
          </p>
          <h2
            className={`${tallerTituloFont.className} mt-3 text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.015em] text-[#2a1812] sm:text-[2.65rem]`}
          >
            {evento.titulo}
          </h2>
        </div>
        <p className="mb-8 leading-relaxed text-[#5d4037]">{evento.descripcion}</p>

        <div className="mb-12 rounded-2xl border border-[#ffd0ba] bg-[#fff1eb] p-6">
          <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-[#963417]">
            <span aria-hidden>🙌🏽</span>
            Este taller es para vos si estás buscando:
          </h3>
          <ul className="space-y-4">
            {evento.beneficios.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[#5d4037]">
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <span className="text-2xl" aria-hidden>
                🗓️
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#963417]">Fecha</p>
              <p className="text-lg font-bold text-[#4a2c21]">{evento.fecha}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <span className="text-2xl" aria-hidden>
                ⏰
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#963417]">Horario</p>
              <p className="text-lg font-bold text-[#4a2c21]">{horarioDisplay}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <span className="text-2xl" aria-hidden>
                📍
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#963417]">Ubicación</p>
              <p className="text-lg font-bold text-[#4a2c21]">{evento.lugar}</p>
              <a
                href={evento.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#963417] underline underline-offset-2"
              >
                Ver en Maps
              </a>
            </div>
          </div>

          <div className="space-y-4 border-t border-[#ffd0ba]/60 pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <span className="text-xl" aria-hidden>
                  🌎
                </span>
              </div>
              <p className="text-[15px] font-semibold leading-snug text-[#5d4037]">{evento.modalidad}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <span className="text-xl" aria-hidden>
                  🫂
                </span>
              </div>
              <p className="text-[15px] font-semibold leading-snug text-[#5d4037]">{evento.publico}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <span className="text-xl" aria-hidden>
                  📝
                </span>
              </div>
              <p className="text-[15px] font-semibold leading-snug text-[#5d4037]">{evento.inscripcion}</p>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-[#963417] px-5 py-4 text-center shadow-lg">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ffd0ba]">
              Valor del taller
            </p>
            <p className="text-2xl font-bold text-white">{formatPrecioArs(evento.precioArs)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TallerInscripcionBoceto({ evento = TALLER_BAHIA_JUNIO_2026 }: { evento?: TallerEventoConfig }) {
  const focusRingColor = hexToRgba(ACCENT_LOGO_V1, 0.35);
  const sectionBg = altBandBg(false);

  const [form, setForm] = useState<FormState>({
    nombre: "",
    mail: "",
    celular: "",
    comentario: "",
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (window.location.hash) return;
    scrollWindowToTop();
  }, []);

  function scrollToInscripcion() {
    const el = document.getElementById("reserva");
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY;
    const topMargin = 56;
    const extraDown = -10;
    window.scrollTo({ top: Math.max(0, y - topMargin + extraDown), behavior: "smooth" });
  }

  useEffect(() => {
    if (!pagoError) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById("taller-pago-error");
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY;
      const topMargin = window.innerHeight * 0.32 + 48;
      window.scrollTo({ top: Math.max(0, y - topMargin), behavior: "smooth" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [pagoError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPagoError(null);
    setFormError(null);

    const parsed = crearTallerInscripcionSchema.safeParse({
      eventoSlug: evento.slug,
      nombre: form.nombre,
      mail: form.mail,
      celular: form.celular,
      comentario: form.comentario,
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Revisá los datos del formulario.";
      setFormError(first);
      return;
    }

    setCheckoutLoading(true);
    try {
      const resPendiente = await fetch("/api/taller/inscripciones/pendiente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const jsonP = (await resPendiente.json().catch(() => ({}))) as {
        error?: string;
        id?: string;
      };
      if (!resPendiente.ok) {
        setPagoError(jsonP.error ?? "No se pudo iniciar la inscripción.");
        return;
      }
      const id = jsonP.id;
      if (!id) {
        setPagoError("Respuesta inválida del servidor.");
        return;
      }

      const resPref = await fetch(`/api/taller/inscripciones/${id}/preferencia`, {
        method: "POST",
      });
      const jsonPref = (await resPref.json().catch(() => ({}))) as {
        error?: string;
        initPoint?: string;
      };
      if (!resPref.ok) {
        setPagoError(jsonPref.error ?? "No se pudo crear el checkout de Mercado Pago.");
        return;
      }
      const initPoint = jsonPref.initPoint;
      if (!initPoint || typeof window === "undefined") {
        setPagoError("No se obtuvo el enlace de pago.");
        return;
      }

      gaEvent("taller_checkout_mercadopago", {
        evento_slug: evento.slug,
        value: evento.precioArs,
        currency: "ARS",
        inscripcion_id: id,
      });

      window.sessionStorage.setItem(PENDING_TALLER_INSCRIPCION_ID_KEY, id);
      window.location.assign(initPoint);
    } catch {
      setPagoError("Error de conexión. Intentá de nuevo.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  const waUrl = `https://wa.me/${evento.whatsappConsultas}?text=${encodeURIComponent(
    "Hola Wanda, tengo una consulta sobre el taller Liberá tu pelvis del 27 de junio en Bahía.",
  )}`;

  return (
    <div style={{ backgroundColor: BRAND_BG_LIGHT }} className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 sm:pt-8">
        <Link
          href="/"
          className="inline-flex text-sm font-medium text-[#963417] underline-offset-2 hover:underline"
        >
          ← Volver al inicio
        </Link>

       {/*  <p className="mt-5 text-[16px] font-semibold text-[#963417] sm:mt-6">
          {evento.fecha} · Bahía Blanca
        </p> */}

        <div className="mt-4 max-w-lg sm:mt-5">
          <FlyerHero evento={evento} onScrollToInscripcion={scrollToInscripcion} />
        </div>
      </div>

      <TallerInfoSection evento={evento} />

      <section
        id="inscripcion"
        className="relative z-10 scroll-mt-24 px-4 pb-24 pt-10 sm:px-6"
        style={{ backgroundColor: sectionBg }}
      >
        <div className="mx-auto max-w-2xl">
          <div id="reserva" className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-zinc-800 sm:text-2xl">Reservá tu lugar</h2>
              <p className="mt-1 text-zinc-600">
                {evento.fecha} · {formatPrecioArs(evento.precioArs)}
              </p>
              <p className="mt-1 text-zinc-500">
                Completá tus datos y pagá con Mercado Pago para confirmar tu lugar.
              </p>

              <form
                className="mt-6 flex flex-col gap-5"
                style={{ ["--form-focus-ring" as string]: focusRingColor } as React.CSSProperties}
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="space-y-1.5">
                  <ReservaFormInput
                    id="taller-nombre"
                    name="nombre"
                    placeholder={TALLER_FORM_FIELDS.nombre.placeholder}
                    ariaLabel={TALLER_FORM_FIELDS.nombre.label}
                    icon={iconPerson}
                    autoComplete="name"
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <ReservaFormInput
                    id="taller-mail"
                    name="mail"
                    type="email"
                    placeholder={TALLER_FORM_FIELDS.mail.placeholder}
                    ariaLabel={TALLER_FORM_FIELDS.mail.label}
                    icon={iconMail}
                    autoComplete="email"
                    value={form.mail}
                    onChange={(e) => setForm((f) => ({ ...f, mail: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <ReservaFormInput
                    id="taller-celular"
                    name="celular"
                    type="tel"
                    placeholder={TALLER_FORM_FIELDS.celular.placeholder}
                    ariaLabel={TALLER_FORM_FIELDS.celular.label}
                    icon={iconPhone}
                    autoComplete="tel"
                    value={form.celular}
                    onChange={(e) => setForm((f) => ({ ...f, celular: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <ReservaFormInput
                    id="taller-comentario"
                    name="comentario"
                    type="textarea"
                    placeholder={TALLER_FORM_FIELDS.comentario.placeholder}
                    ariaLabel={TALLER_FORM_FIELDS.comentario.label}
                    icon={iconComment}
                    value={form.comentario}
                    onChange={(e) => setForm((f) => ({ ...f, comentario: e.target.value }))}
                  />
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-zinc-800">Pago con Mercado Pago</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    La inscripción se confirmará cuando Mercado Pago apruebe el pago.
                  </p>
                  {formError ? (
                    <p className="mt-3 text-sm font-medium text-red-600" role="alert">
                      {formError}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <MercadoPagoButton
                      type="submit"
                      label={checkoutLoading ? "Redirigiendo…" : "Pagar e inscribirme"}
                      disabled={checkoutLoading}
                    />
                  </div>
                  {pagoError ? (
                    <p
                      id="taller-pago-error"
                      role="alert"
                      className="mt-3 scroll-mt-28 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-snug text-red-900"
                    >
                      {pagoError}
                    </p>
                  ) : null}
                </div>
              </form>

              <div className="mt-6 border-t border-zinc-100 pt-6 text-center">
                <p className="text-sm text-zinc-600">¿Preferís consultar antes de inscribirte?</p>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex text-sm font-semibold text-[#1a7a3a] underline-offset-2 hover:underline"
                >
                  Escribile a Wanda por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
