"use client";

import { forwardRef, useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  MessageCircle,
  Trash2,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";

import type { PanelCalendarioEvento } from "../../lib/turnos/panel-events";
import {
  isTurnoInProgress,
  isTurnoTimeFocused,
  panelDurationLabel,
} from "../../lib/booking/panel-now-focus";
import {
  canManageTurno,
  canReprogramConsultaIndividual,
  origenCardLabel,
  panelResumenVisible,
  turnoStatusChip,
  type TurnoEstado,
} from "../../lib/panel/panel-turno-helpers";
import { PanelTurnoDetalle } from "./panel-turno-detalle";

type PanelTurnoCardProps = {
  ev: PanelCalendarioEvento;
  selectedDateKey: string;
  whatsAppUrl: string | null;
  guardandoId: string | null;
  onRequestCancel: () => void;
  cancelDisabled?: boolean;
  onEstadoChange: (estado: TurnoEstado) => void;
  onNotaChange: (value: string) => void;
  onNotaBlur: (value: string) => void;
};

function TipoIcon({ tipoCita, muted }: { tipoCita: string; muted?: boolean }) {
  const cls = `h-4 w-4 shrink-0 ${muted ? "text-gray-500" : "text-[#B88E2F]"}`;
  if (tipoCita === "clase_grupal" || tipoCita === "evaluacion_grupal") {
    return <Users className={cls} strokeWidth={1.85} />;
  }
  return <HeartPulse className={cls} strokeWidth={1.85} />;
}

export const PanelTurnoCard = forwardRef<HTMLElement, PanelTurnoCardProps>(function PanelTurnoCard(
  {
    ev,
    selectedDateKey,
    whatsAppUrl,
    guardandoId,
    onRequestCancel,
    cancelDisabled = false,
    onEstadoChange,
    onNotaChange,
    onNotaBlur,
  },
  ref,
) {
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const focused = isTurnoTimeFocused(ev.timeLocal, selectedDateKey);
  const inProgress = isTurnoInProgress(ev.timeLocal, ev.tipoCita, selectedDateKey);
  const chip = turnoStatusChip(ev, inProgress);
  const duration = panelDurationLabel(ev.tipoCita);
  const customerName = ev.nombre.trim() || "Cliente";
  const resumen = panelResumenVisible(ev);
  const origenLabel = origenCardLabel(ev.origenReserva);
  const canManage = canManageTurno(ev);
  const canReprogram = canReprogramConsultaIndividual(ev);

  return (
    <article
      ref={ref}
      className={[
        "overflow-hidden rounded-[22px] border bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] transition-shadow",
        focused ? "border-[#E8D5A8] ring-2 ring-[#B88E2F]/30" : "border-gray-200",
      ].join(" ")}
    >
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className={[
              "rounded-full px-3.5 py-1.5 text-[16px] font-semibold leading-none tabular-nums tracking-tight",
              focused ? "bg-[#F5E6C8] text-[#5C4A1F]" : "bg-gray-100 text-gray-800",
            ].join(" ")}
          >
            {ev.timeLocal}
          </span>
          {duration ? (
            <span
              className={[
                "shrink-0 text-[15px] font-semibold tabular-nums tracking-tight",
                focused ? "text-[#8B6914]" : "text-gray-600",
              ].join(" ")}
            >
              {duration}
            </span>
          ) : null}
        </div>

        <h3
          className={[
            "mt-3 text-[22px] font-bold leading-tight break-words",
            focused ? "text-gray-900" : "text-gray-800",
          ].join(" ")}
        >
          {customerName}
        </h3>

        <div className="mt-2 space-y-1">
          <p
            className={[
              "flex items-start gap-2 text-[15px] font-semibold leading-snug",
              focused ? "text-gray-900" : "text-gray-800",
            ].join(" ")}
          >
            <TipoIcon tipoCita={ev.tipoCita} muted={!focused} />
            <span className="min-w-0">{ev.titulo}</span>
          </p>

          {resumen ? (
            <p
              className={[
                "pl-6 text-[14px] font-medium leading-snug",
                focused ? "text-[#6B5420]" : "text-gray-700",
              ].join(" ")}
            >
              {resumen}
            </p>
          ) : null}
        </div>

        {origenLabel ? (
          <p
            className={`mt-2 flex items-center gap-1.5 text-[12px] ${focused ? "text-gray-600" : "text-gray-500"}`}
          >
            <User className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            {origenLabel}
          </p>
        ) : null}

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
      </div>

      {canManage ? (
        <div className="border-t border-gray-100 px-4 pt-3 pb-3.5">
          {canReprogram ? (
            <Link
              href={`/panel-turnos/reprogramar/${encodeURIComponent(ev.turnoId)}`}
              className={[
                "flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition active:scale-[0.99]",
                focused
                  ? "bg-[#B88E2F] text-white shadow-sm hover:bg-[#A67D28]"
                  : "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              <CalendarClock className="h-5 w-5 shrink-0" strokeWidth={2} />
              Reprogramar
            </Link>
          ) : null}

          <div className={`flex items-center justify-between gap-3 ${canReprogram ? "mt-2.5" : ""}`}>
            {whatsAppUrl ? (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 cursor-pointer items-center gap-1.5 text-[13px] font-medium text-[#1A7A3A] underline-offset-2 hover:underline"
              >
                <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span className="truncate">Enviar WhatsApp</span>
              </a>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={onRequestCancel}
              disabled={cancelDisabled}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-[13px] font-medium text-red-600 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Cancelar
            </button>
          </div>

          <button
            type="button"
            onClick={() => setDetalleAbierto((v) => !v)}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2 text-[13px] font-semibold text-gray-600 transition hover:bg-gray-100"
          >
            {detalleAbierto ? (
              <>
                <ChevronUp className="h-4 w-4" strokeWidth={2} />
                Cerrar detalle
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" strokeWidth={2} />
                Ver detalle
              </>
            )}
          </button>

          {detalleAbierto ? (
            <PanelTurnoDetalle
              ev={ev}
              guardandoId={guardandoId}
              onEstadoChange={onEstadoChange}
              onNotaChange={onNotaChange}
              onNotaBlur={onNotaBlur}
            />
          ) : null}
        </div>
      ) : (
        <div className="border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={() => setDetalleAbierto((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2 text-[13px] font-semibold text-gray-600 transition hover:bg-gray-100"
          >
            {detalleAbierto ? (
              <>
                <ChevronUp className="h-4 w-4" strokeWidth={2} />
                Cerrar detalle
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" strokeWidth={2} />
                Ver detalle
              </>
            )}
          </button>
          {detalleAbierto ? (
            <PanelTurnoDetalle
              ev={ev}
              guardandoId={guardandoId}
              onEstadoChange={onEstadoChange}
              onNotaChange={onNotaChange}
              onNotaBlur={onNotaBlur}
            />
          ) : null}
        </div>
      )}
    </article>
  );
});
