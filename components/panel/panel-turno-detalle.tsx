"use client";

import { Mail, MessageCircle } from "lucide-react";

import type { PanelCalendarioEvento } from "../../lib/turnos/panel-events";
import {
  buildWhatsAppLink,
  ESTADO_OPCIONES,
  panelDetalleLineas,
  type TurnoEstado,
} from "../../lib/panel/panel-turno-helpers";
import { reservaOrigenLabel } from "../../lib/turnos/reserva-origen";
import { panelInput, panelLabel } from "./panel-ui";

const DETALLE_ETIQUETA = "text-[13px] font-semibold text-gray-500";
const DETALLE_VALOR = "text-[15px] font-medium leading-snug text-gray-900";
const DETALLE_INFO = "text-[15px] font-medium leading-relaxed text-gray-800";

type PanelTurnoDetalleProps = {
  ev: PanelCalendarioEvento;
  guardandoId: string | null;
  onEstadoChange: (estado: TurnoEstado) => void;
  onNotaChange: (value: string) => void;
  onNotaBlur: (value: string) => void;
};

export function PanelTurnoDetalle({
  ev,
  guardandoId,
  onEstadoChange,
  onNotaChange,
  onNotaBlur,
}: PanelTurnoDetalleProps) {
  const lineasDetalle = panelDetalleLineas(ev);
  const whatsAppUrl = buildWhatsAppLink(ev);
  const mail = ev.mail.trim();
  const celular = ev.celular.trim();
  const hayContacto = Boolean(mail || celular);

  return (
    <div className="mt-3 space-y-4 border-t border-gray-100 pt-4">
      {hayContacto ? (
        <div className="space-y-3 rounded-xl bg-gray-50 px-3.5 py-3">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-gray-400">Contacto</p>
          {mail ? (
            <div className="space-y-0.5">
              <p className={DETALLE_ETIQUETA}>Mail</p>
              <a
                href={`mailto:${mail}`}
                className={`${DETALLE_VALOR} inline-flex items-center gap-2 break-all text-[#B88E2F] underline-offset-2 hover:underline`}
              >
                <Mail className="h-4 w-4 shrink-0" strokeWidth={2} />
                {mail}
              </a>
            </div>
          ) : null}
          {celular ? (
            <div className="space-y-1">
              <p className={DETALLE_ETIQUETA}>Celular</p>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={DETALLE_VALOR}>{celular}</span>
                {whatsAppUrl ? (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#25D366]/12 px-3 py-1.5 text-[13px] font-semibold text-[#1A7A3A] ring-1 ring-[#25D366]/35 transition hover:bg-[#25D366]/20"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    Ir al chat
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className={DETALLE_INFO}>
          <span className="text-gray-500">Origen:</span> {reservaOrigenLabel(ev.origenReserva)}
        </p>
        {lineasDetalle.map((linea) => (
          <p key={linea} className={DETALLE_INFO}>
            {linea}
          </p>
        ))}
      </div>

      {ev.mpPaymentId ? (
        <p className="text-[14px] leading-snug text-gray-500">
          Ref. Mercado Pago:{" "}
          <span className="font-medium text-gray-700">{ev.mpPaymentId}</span>
        </p>
      ) : null}

      <div className="space-y-3 border-t border-gray-100 pt-4">
        <div>
          <label className={panelLabel} htmlFor={`estado-${ev.id}`}>
            Estado
          </label>
          <select
            id={`estado-${ev.id}`}
            className={`${panelInput} mt-1 cursor-pointer py-2.5 text-[14px]`}
            value={
              ESTADO_OPCIONES.some((o) => o.value === ev.estado) ? (ev.estado as TurnoEstado) : "pendiente"
            }
            onChange={(e) => onEstadoChange(e.target.value as TurnoEstado)}
          >
            {ESTADO_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={panelLabel} htmlFor={`nota-${ev.id}`}>
            Nota interna
          </label>
          <textarea
            id={`nota-${ev.id}`}
            className={`${panelInput} mt-1 min-h-[80px] resize-y py-2.5 text-[14px]`}
            placeholder="Nota interna…"
            value={ev.notaInterna}
            onChange={(e) => onNotaChange(e.target.value)}
            onBlur={(e) => onNotaBlur(e.target.value)}
          />
        </div>
        {guardandoId === ev.turnoId ? (
          <p className="text-[13px] text-gray-400">Guardando…</p>
        ) : null}
      </div>
    </div>
  );
}
