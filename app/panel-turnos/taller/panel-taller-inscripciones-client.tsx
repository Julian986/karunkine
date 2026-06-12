"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PanelTallerInscripcionCard } from "../../../components/panel/panel-taller-inscripcion-card";
import { panelBackLink, panelCard, panelContainer, panelPage, panelPageBg } from "../../../components/panel/panel-ui";
import type {
  PanelTallerEventoResumen,
  PanelTallerInscripcionRow,
  PanelTallerInscripcionesResumen,
} from "../../../lib/taller/panel-taller-inscripciones";

type ApiResponse = {
  evento?: PanelTallerEventoResumen;
  resumen?: PanelTallerInscripcionesResumen;
  inscripciones?: PanelTallerInscripcionRow[];
  error?: string;
};

export function PanelTallerInscripcionesClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evento, setEvento] = useState<PanelTallerEventoResumen | null>(null);
  const [resumen, setResumen] = useState<PanelTallerInscripcionesResumen | null>(null);
  const [rows, setRows] = useState<PanelTallerInscripcionRow[]>([]);
  const [showExpirados, setShowExpirados] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/panel-turnos/taller-inscripciones", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = (await res.json()) as ApiResponse;
        if (!res.ok) {
          if (alive) setError(data.error ?? "No se pudieron cargar las inscripciones.");
          return;
        }
        if (alive) {
          setEvento(data.evento ?? null);
          setResumen(data.resumen ?? null);
          setRows(Array.isArray(data.inscripciones) ? data.inscripciones : []);
        }
      } catch {
        if (alive) setError("Sin conexión.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const visibleRows = useMemo(() => {
    return rows.filter((r) => {
      if (r.estado === "cancelado") return false;
      if (r.estado === "expirado") return showExpirados;
      return true;
    });
  }, [rows, showExpirados]);

  const expiradosCount = resumen?.expirados ?? 0;

  return (
    <>
      <Link href="/panel-turnos" className={panelBackLink}>
        ← Volver al panel
      </Link>

      <header className="mt-2 pb-2">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-gray-500">Taller</p>
        <h1 className="font-montserrat text-[22px] font-bold leading-tight text-gray-900">Inscriptos</h1>
        {evento ? (
          <p className="mt-1 text-[14px] text-gray-500">
            {evento.titulo} · {evento.fecha}
          </p>
        ) : null}
      </header>

      {resumen ? (
        <section className={`mt-4 ${panelCard} p-4`}>
          <p className="font-montserrat text-[16px] font-semibold text-gray-900">
            Taller {evento?.fechaCorta ?? ""} — {resumen.confirmados} confirmados · {resumen.pendientes}{" "}
            {resumen.pendientes === 1 ? "pendiente" : "pendientes"}
          </p>
          <p className="mt-1 text-[13px] text-gray-500">{resumen.total} inscripciones en total</p>
        </section>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[14px] font-medium text-gray-600">
          {visibleRows.length} {visibleRows.length === 1 ? "persona" : "personas"}
        </p>
        {expiradosCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowExpirados((v) => !v)}
            className={[
              "flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-[13px] transition",
              showExpirados
                ? "border-gray-300 bg-gray-100 text-gray-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            ].join(" ")}
            aria-pressed={showExpirados}
          >
            <span className="font-semibold">{expiradosCount}</span>
            <span className="font-semibold">{expiradosCount === 1 ? "Expirada" : "Expiradas"}</span>
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {loading ? (
          <p className="py-10 text-center text-[14px] text-gray-500">Cargando inscripciones…</p>
        ) : error ? (
          <p className="py-10 text-center text-[14px] text-red-600">{error}</p>
        ) : visibleRows.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-gray-500">
            {showExpirados ? "No hay inscripciones para mostrar." : "Todavía no hay inscriptos confirmados ni pendientes."}
          </p>
        ) : (
          visibleRows.map((row) => <PanelTallerInscripcionCard key={row.id} row={row} />)
        )}
      </div>
    </>
  );
}
