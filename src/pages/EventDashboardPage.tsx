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
import { buttonSecondaryClass, inputClass } from "../components/form/FormField";
import { useEventData } from "../hooks/useEventData";
import { useEventPayments } from "../hooks/useEventPayments";
import { useEvents } from "../hooks/useEvents";
import {
  contarBoletasPorEstado,
  contarPalcosPorEstado,
  montoComprometidoPalco,
} from "../lib/estado";
import { formatCOP, formatFecha } from "../lib/format";
import { paymentMatchesQuery } from "../lib/search";
import type { BoletaSale, Comprador, MetodoPago, Palco, Payment } from "../types";

const metodoLabel: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

interface PaymentContext {
  palcoNumero?: number;
  comprador: Comprador | null;
  descripcion: string;
}

/**
 * Un pago no guarda a quién/qué palco pertenece (solo eventId/localidadId para
 * las queries del dashboard); esto lo reconstruye cruzando el id del padre
 * (capturado en listenEventPayments) contra los palcos y ventas ya cargados.
 */
function resolvePaymentContext(
  payment: Payment,
  palcoById: Map<string, Palco>,
  saleById: Map<string, BoletaSale>,
): PaymentContext {
  if (payment.palcoId) {
    const palco = palcoById.get(payment.palcoId);
    if (payment.parentId === payment.palcoId) {
      return {
        palcoNumero: palco?.numero,
        comprador: palco?.comprador ?? null,
        descripcion: `Palco N.° ${palco?.numero ?? "?"}`,
      };
    }
    return {
      palcoNumero: palco?.numero,
      comprador: null,
      descripcion: `Palco N.° ${palco?.numero ?? "?"} (boleta suelta)`,
    };
  }
  const sale = payment.parentId ? saleById.get(payment.parentId) : undefined;
  return {
    comprador: sale?.comprador ?? null,
    descripcion: sale ? `Boleta suelta — ${sale.comprador.nombre}` : "Boleta suelta",
  };
}

export function EventDashboardPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { localities, palcosByLocality, salesByLocality, allPalcos, allSales, loading } =
    useEventData(eventId);
  const { payments } = useEventPayments(eventId);
  const { events } = useEvents();
  const [descargando, setDescargando] = useState(false);
  const [metodoFiltro, setMetodoFiltro] = useState<MetodoPago | "todos">("todos");
  const [busquedaPagos, setBusquedaPagos] = useState("");

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

  const palcoById = new Map(allPalcos.map((p) => [p.id, p]));
  const saleById = new Map(allSales.map((s) => [s.id, s]));

  const pagosFiltrados = payments
    .filter((p) => metodoFiltro === "todos" || p.metodo === metodoFiltro)
    .map((p) => ({ payment: p, contexto: resolvePaymentContext(p, palcoById, saleById) }))
    .filter(({ contexto }) => paymentMatchesQuery(contexto, busquedaPagos))
    .reverse();

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
              <button
                key={metodo}
                type="button"
                onClick={() => setMetodoFiltro((prev) => (prev === metodo ? "todos" : metodo))}
                className={`rounded-xl text-left transition duration-150 ease-out-strong ${
                  metodoFiltro === metodo ? "ring-2 ring-series-1" : ""
                }`}
              >
                <StatCard label={metodoLabel[metodo]} value={formatCOP(recaudadoPorMetodo[metodo])} />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-gridline bg-surface-1 p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Verificar pagos</h2>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row">
            <select
              value={metodoFiltro}
              onChange={(e) => setMetodoFiltro(e.target.value as MetodoPago | "todos")}
              className={`sm:max-w-xs ${inputClass}`}
              aria-label="Filtrar pagos por método de pago"
            >
              <option value="todos">Todos los métodos</option>
              {(Object.keys(metodoLabel) as MetodoPago[]).map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodoLabel[metodo]}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={busquedaPagos}
              onChange={(e) => setBusquedaPagos(e.target.value)}
              placeholder="Buscar por número de palco o nombre del comprador"
              className={inputClass}
              aria-label="Buscar pagos por número de palco o comprador"
            />
          </div>
          {pagosFiltrados.length === 0 ? (
            <p className="text-sm text-text-muted">Ningún pago coincide con el filtro.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-gridline overflow-y-auto">
              {pagosFiltrados.map(({ payment, contexto }) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">{formatCOP(payment.monto)}</p>
                    <p className="text-text-muted">
                      {formatFecha(payment.fecha)} · {metodoLabel[payment.metodo]} · {contexto.descripcion}
                      {payment.nota ? ` · ${payment.nota}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
