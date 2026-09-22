import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { PalcoEstadoChart } from "../components/dashboard/PalcoEstadoChart";
import { RecaudoTimelineChart } from "../components/dashboard/RecaudoTimelineChart";
import { StatCard } from "../components/dashboard/StatCard";
import {
  VentasPorLocalidadChart,
  type VentasPorLocalidadDatum,
} from "../components/dashboard/VentasPorLocalidadChart";
import { buttonSecondaryClass } from "../components/form/FormField";
import { useEventData } from "../hooks/useEventData";
import { useEventPayments } from "../hooks/useEventPayments";
import { useEvents } from "../hooks/useEvents";
import { backfillPaymentEventIds } from "../lib/backfillPayments";
import {
  contarBoletasPorEstado,
  contarPalcosPorEstado,
  montoComprometidoPalco,
} from "../lib/estado";
import { formatCOP } from "../lib/format";
import type { MetodoPago } from "../types";

const metodoLabel: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

export function EventDashboardPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { localities, palcosByLocality, salesByLocality, allPalcos, allSales, loading } =
    useEventData(eventId);
  const { payments } = useEventPayments(eventId);
  const { events } = useEvents();
  const [descargando, setDescargando] = useState(false);
  const [reparando, setReparando] = useState(false);
  const [reparacionMensaje, setReparacionMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
    null,
  );

  if (!eventId) return null;

  const evento = events.find((e) => e.id === eventId);

  async function handleDescargarReporte() {
    setDescargando(true);
    try {
      // Import dinámico: exceljs es pesado y solo se necesita al descargar el reporte,
      // no en cada visita al Dashboard.
      const { descargarReporteEvento } = await import("../lib/report");
      await descargarReporteEvento({
        eventoNombre: evento?.nombre ?? "evento",
        localities,
        palcosByLocality,
        salesByLocality,
      });
    } finally {
      setDescargando(false);
    }
  }

  async function handleReparar() {
    setReparando(true);
    setReparacionMensaje(null);
    try {
      const { total, fixed } = await backfillPaymentEventIds();
      setReparacionMensaje({
        tipo: "ok",
        texto: `Revisados: ${total}. Reparados: ${fixed}.`,
      });
    } catch (err) {
      setReparacionMensaje({
        tipo: "error",
        texto: err instanceof Error ? err.message : "Error desconocido al reparar pagos.",
      });
    } finally {
      setReparando(false);
    }
  }

  const palcoStats = contarPalcosPorEstado(allPalcos);
  const boletaStats = contarBoletasPorEstado(allSales);

  const montoComprometido =
    allPalcos.reduce((sum, p) => sum + montoComprometidoPalco(p), 0) +
    allSales.reduce((sum, s) => sum + s.montoTotal, 0);
  const montoRecaudado =
    allPalcos.reduce((sum, p) => sum + p.montoAbonado, 0) +
    allSales.reduce((sum, s) => sum + s.montoAbonado, 0);
  const montoPendiente = Math.max(0, montoComprometido - montoRecaudado);

  const recaudadoPorMetodo = payments.reduce<Record<MetodoPago, number>>(
    (acc, p) => {
      acc[p.metodo] = (acc[p.metodo] ?? 0) + p.monto;
      return acc;
    },
    { efectivo: 0, transferencia: 0, tarjeta: 0 },
  );

  const ventasPorLocalidad: VentasPorLocalidadDatum[] = localities.map((loc) => {
    const palcos = palcosByLocality[loc.id] ?? [];
    const sales = salesByLocality[loc.id] ?? [];
    const comprometido =
      palcos.reduce((s, p) => s + montoComprometidoPalco(p), 0) +
      sales.reduce((s, sale) => s + sale.montoTotal, 0);
    const recaudado =
      palcos.reduce((s, p) => s + p.montoAbonado, 0) + sales.reduce((s, sale) => s + sale.montoAbonado, 0);
    return {
      nombre: loc.nombre,
      recaudado,
      pendiente: Math.max(0, comprometido - recaudado),
    };
  });

  return (
    <div className="min-h-screen bg-surface-2">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-text-primary">Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReparar}
              disabled={reparando}
              className={`inline-flex min-h-11 items-center gap-2 ${buttonSecondaryClass}`}
              title="Completa eventId/localidadId en pagos antiguos que no aparecen en el dashboard"
            >
              {reparando ? "Reparando..." : "Reparar pagos antiguos"}
            </button>
            <button
              type="button"
              onClick={handleDescargarReporte}
              disabled={descargando || loading}
              className={`inline-flex min-h-11 items-center gap-2 ${buttonSecondaryClass}`}
            >
              <DownloadIcon className="h-4 w-4" />
              {descargando ? "Generando..." : "Descargar reporte (Excel)"}
            </button>
          </div>
        </div>

        {reparacionMensaje && (
          <p
            className={`mb-6 text-sm ${
              reparacionMensaje.tipo === "error" ? "text-status-critical" : "text-status-good"
            }`}
          >
            {reparacionMensaje.texto}
          </p>
        )}

        <Link
          to={`/eventos/${eventId}/localidades`}
          className="group mb-8 flex flex-col items-start gap-3 rounded-xl border border-gridline bg-surface-1 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-display text-lg font-semibold text-text-primary">Palcos y boletas</p>
            <p className="text-sm text-text-secondary">
              Entra a las localidades para ver reservas, vender boletas y registrar abonos.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-series-1 px-4 py-2 text-sm font-medium text-on-accent transition group-hover:opacity-90">
            Ver localidades
            <span aria-hidden="true">→</span>
          </span>
        </Link>

        {loading && <p className="text-text-muted">Cargando datos del evento...</p>}

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Palcos disponibles" value={String(palcoStats.disponibles)} />
          <StatCard label="Palcos separados" value={String(palcoStats.separados)} accentClass="text-status-warning" />
          <StatCard label="Palcos vendidos" value={String(palcoStats.vendidos)} accentClass="text-status-good" />
          <StatCard label="Boletas separadas" value={String(boletaStats.separadas)} accentClass="text-status-warning" />
          <StatCard label="Boletas vendidas" value={String(boletaStats.vendidas)} accentClass="text-status-good" />
          <StatCard label="Total palcos" value={String(palcoStats.total)} />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Ingresos comprometidos" value={formatCOP(montoComprometido)} />
          <StatCard label="Recaudado" value={formatCOP(montoRecaudado)} accentClass="text-status-good" />
          <StatCard label="Pendiente por cobrar" value={formatCOP(montoPendiente)} accentClass="text-status-warning" />
        </div>

        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Recaudado por método de pago</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(Object.keys(metodoLabel) as MetodoPago[]).map((metodo) => (
              <StatCard
                key={metodo}
                label={metodoLabel[metodo]}
                value={formatCOP(recaudadoPorMetodo[metodo])}
              />
            ))}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gridline bg-surface-1 p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Estado de los palcos</h2>
            <PalcoEstadoChart
              disponibles={palcoStats.disponibles}
              separados={palcoStats.separados}
              vendidos={palcoStats.vendidos}
            />
          </div>
          <div className="rounded-xl border border-gridline bg-surface-1 p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Recaudo por localidad</h2>
            <VentasPorLocalidadChart data={ventasPorLocalidad} />
          </div>
        </div>

        <div className="rounded-xl border border-gridline bg-surface-1 p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Recaudo acumulado en el tiempo</h2>
          <RecaudoTimelineChart payments={payments} />
        </div>
      </main>
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 2v8" />
      <path d="M4.5 7.5L8 11l3.5-3.5" />
      <path d="M2.5 12.5v1a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1" />
    </svg>
  );
}
