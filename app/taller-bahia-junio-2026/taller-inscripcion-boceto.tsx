"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { MercadoPagoButton } from "../components/MercadoPagoButton";
import { ACCENT_LOGO_V1, hexToRgba } from "../components/LogoAccentContext";
import {
  iconComment,
  iconMail,
  iconPerson,
  iconPhone,
  ReservaFormInput,
} from "../components/ReservaFormInput";
import {
  TALLER_BAHIA_JUNIO_2026,
  TALLER_FORM_FIELDS,
  type TallerEventoConfig,
} from "../../lib/taller/evento-config";
import { altBandBg, BRAND_BG_LIGHT } from "../lib/brand-colors";

type FormState = {
  nombre: string;
  mail: string;
  celular: string;
  comentario: string;
};

function FlyerHero({
  evento,
  onScrollToInscripcion,
}: {
  evento: TallerEventoConfig;
  onScrollToInscripcion: () => void;
}) {
  const inscribirseBtn = (
    <button
      type="button"
      onClick={onScrollToInscripcion}
      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#963417] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_6px_20px_rgba(150,52,23,0.35)] transition hover:bg-[#a8431c] hover:shadow-lg active:scale-[0.99]"
    >
      Inscribirme
      <span aria-hidden>↓</span>
    </button>
  );

  if (evento.imagenFlyerSrc) {
    return (
      <div>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(61,32,16,0.18)] sm:aspect-[3/4]">
          <Image
            src={evento.imagenFlyerSrc}
            alt={`Flyer — ${evento.titulo}`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 480px"
          />
        </div>
        <div className="mt-4 flex justify-center">{inscribirseBtn}</div>
      </div>
    );
  }

  return (
    <div className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#c4933f]/45 bg-gradient-to-br from-[#f5ebe0] to-[#e8dcc8] px-6 text-center shadow-inner sm:aspect-[3/4]">
      <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#8a5a24]">Flyer</p>
      {inscribirseBtn}
    </div>
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
  const [bocetoMsg, setBocetoMsg] = useState<string | null>(null);

  function scrollToInscripcion() {
    document.getElementById("inscripcion")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBocetoMsg(
      "La inscripción online con pago se habilitará próximamente. Si querés reservar tu lugar antes, escribinos por WhatsApp.",
    );
    scrollToInscripcion();
  }

  const waUrl = `https://wa.me/${evento.whatsappConsultas}?text=${encodeURIComponent(
    "Hola Wanda, tengo una consulta sobre el taller del 27 de junio en Bahía.",
  )}`;

  return (
    <div style={{ backgroundColor: BRAND_BG_LIGHT }} className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 pt-8 sm:px-6">
        <Link
          href="/"
          className="inline-flex text-sm font-medium text-[#963417] underline-offset-2 hover:underline"
        >
          ← Volver al inicio
        </Link>

        <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.12em] text-[#8a5a24]">
          Inscripción online
        </p>
        <h1 className="mt-2 text-balance text-[28px] font-bold leading-tight text-[#3d2010] sm:text-[32px]">
          {evento.titulo}
        </h1>

        <div className="mt-8 max-w-lg">
          <FlyerHero evento={evento} onScrollToInscripcion={scrollToInscripcion} />
        </div>
      </div>

      <section
        id="inscripcion"
        className="relative z-10 scroll-mt-24 px-4 pb-24 pt-10 sm:px-6"
        style={{ backgroundColor: sectionBg }}
      >
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-zinc-800 sm:text-2xl">Inscribite al taller</h2>
              <p className="mt-1 text-zinc-500">
                La inscripción y el pago online estarán disponibles muy pronto.
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
                    Próximamente vas a poder completar tu inscripción y pagar con tarjeta, Mercado Pago y más.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <MercadoPagoButton type="submit" label="Pagar e Inscribirme" />
                  </div>
                  {bocetoMsg ? (
                    <p
                      role="status"
                      className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-snug text-amber-950"
                    >
                      {bocetoMsg}
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
