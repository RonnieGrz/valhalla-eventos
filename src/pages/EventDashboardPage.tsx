import { useParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { PalcoEstadoChart } from "../components/dashboard/PalcoEstadoChart";
import { RecaudoTimelineChart } from "../components/dashboard/RecaudoTimelineChart";
import { StatCard } from "../components/dashboard/StatCard";
import {
  VentasPorLocalidadChart,
  type VentasPorLocalidadDatum,
} from "../components/dashboard/VentasPorLocalidadChart";
import { useEventData } from "../hooks/useEventData";
import { useEventPayments } from "../hooks/useEventPayments";
import {
  contarBoletasPorEstado,
  contarPalcosPorEstado,
  montoComprometidoPalco,
} from "../lib/estado";
import { formatCOP } from "../lib/format";

export function EventDashboardPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { localities, palcosByLocality, salesByLocality, allPalcos, allSales, loading } =
    useEventData(eventId);
  const { payments } = useEventPayments(eventId);

  if (!eventId) return null;

  const palcoStats = contarPalcosPorEstado(allPalcos);
  const boletaStats = contarBoletasPorEstado(allSales);

  const montoComprometido =
    allPalcos.reduce((sum, p) => sum + montoComprometidoPalco(p), 0) +
    allSales.reduce((sum, s) => sum + s.montoTotal, 0);
  const montoRecaudado =
    allPalcos.reduce((sum, p) => sum + p.montoAbonado, 0) +
    allSales.reduce((sum, s) => sum + s.montoAbonado, 0);
  const montoPendiente = Math.max(0, montoComprometido - montoRecaudado);

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
        <h1 className="mb-6 text-2xl font-bold text-text-primary">Dashboard</h1>

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
