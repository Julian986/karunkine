"use client";

import { Check, Mail, MessageCircle } from "lucide-react";

import type { PanelTallerInscripcionRow } from "../../lib/taller/panel-taller-inscripciones";
import {
  buildTallerInscripcionWhatsAppLink,
  tallerInscripcionStatusChip,
} from "../../lib/taller/panel-taller-inscripciones";

type PanelTallerInscripcionCardProps = {
  row: PanelTallerInscripcionRow;
};

function formatInscripcionFecha(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}

export function PanelTallerInscripcionCard({ row }: PanelTallerInscripcionCardProps) {
  const chip = tallerInscripcionStatusChip(row.estado);
  const whatsAppUrl = buildTallerInscripcionWhatsAppLink(row);
  const mail = row.mail.trim();
  const comentario = row.comentario.trim();

  return (
    <article className="overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
      <div className="p-4">
        <h3 className="font-montserrat text-[20px] font-bold leading-tight text-gray-900">{row.nombre}</h3>

        <div className="mt-3">
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold",
              chip.badgeClass,
            ].join(" ")}
          >
            {chip.showCheck ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} /> : null}
            {chip.badge}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-[14px] text-gray-700">
          <p>
            <span className="font-medium text-gray-500">Celular:</span> {row.celular || "—"}
          </p>
          {mail ? (
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-gray-500">Mail:</span>
              <a
                href={`mailto:${mail}`}
                className="inline-flex items-center gap-1.5 text-[#B88E2F] underline-offset-2 hover:underline"
              >
                <Mail className="h-4 w-4 shrink-0" strokeWidth={2} />
                {mail}
              </a>
            </p>
          ) : null}
          {comentario ? (
            <p className="rounded-xl bg-gray-50 px-3 py-2 leading-snug text-gray-800">{comentario}</p>
          ) : null}
          <p className="text-[12px] text-gray-500">
            Inscripción: {formatInscripcionFecha(row.createdAt)}
            {row.confirmedAt ? ` · Confirmada: ${formatInscripcionFecha(row.confirmedAt)}` : ""}
          </p>
        </div>

        {whatsAppUrl ? (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-[#1A7A3A] underline-offset-2 hover:underline"
          >
            <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
            Enviar WhatsApp
          </a>
        ) : null}
      </div>
    </article>
  );
}
