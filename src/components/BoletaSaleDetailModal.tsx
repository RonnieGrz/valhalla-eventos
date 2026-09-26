import { useEffect, useState } from "react";
import { saldoPendiente } from "../lib/estado";
import {
  agregarAbonoVenta,
  editarAbonoVenta,
  editarCantidadVenta,
  listenBoletaSalePayments,
} from "../services/boletaSales";
import type { BoletaSale, Payment } from "../types";
import { EditarCantidadBoletaForm } from "./EditarCantidadBoletaForm";
import { EstadoBadge } from "./EstadoBadge";
import { Modal } from "./Modal";
import { PaymentForm } from "./PaymentForm";
import { PaymentHistoryList } from "./PaymentHistoryList";
import { PaymentProgress } from "./PaymentProgress";
import { buttonPrimaryClass } from "./form/FormField";

interface BoletaSaleDetailModalProps {
  eventId: string;
  localityId: string;
  sale: BoletaSale;
  /** Cupo máximo que puede tener esta venta (cupo restante de la localidad + lo que ya tiene esta venta). */
  maxCantidad: number;
  aforoTotal: number;
  onClose: () => void;
}

export function BoletaSaleDetailModal({
  eventId,
  localityId,
  sale,
  maxCantidad,
  aforoTotal,
  onClose,
}: BoletaSaleDetailModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [mode, setMode] = useState<"view" | "abonar">("view");
  const [error, setError] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingCantidad, setEditingCantidad] = useState(false);
  const [cantidadError, setCantidadError] = useState<string | null>(null);

  useEffect(
    () => listenBoletaSalePayments(eventId, localityId, sale.id, setPayments),
    [eventId, localityId, sale.id],
  );

  const pendiente = saldoPendiente(sale.montoTotal, sale.montoAbonado);

  return (
    <Modal title={`Venta · ${sale.cantidad} boleta(s)`} onClose={onClose}>
      <div className="mb-4 flex items-center gap-2">
        <EstadoBadge estado={sale.estado} />
      </div>

      <div className="mb-4 flex items-start justify-between gap-2 rounded-lg border border-gridline p-3 text-sm">
        <div>
          <p className="font-medium text-text-primary">{sale.comprador.nombre}</p>
          <p className="text-text-secondary">CC {sale.comprador.cedula}</p>
          <p className="text-text-secondary">{sale.comprador.telefono}</p>
          <p className="mt-1 text-text-secondary">{sale.cantidad} boleta(s)</p>
        </div>
        <button
          type="button"
          onClick={() => setEditingCantidad(true)}
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 py-1 text-sm font-medium text-series-1 transition duration-150 ease-out-strong hover:bg-surface-2 active:scale-[0.97]"
        >
          Editar cantidad
        </button>
      </div>

      <div className="mb-4">
        <PaymentProgress montoTotal={sale.montoTotal} montoAbonado={sale.montoAbonado} />
      </div>

      {mode === "abonar" ? (
        <PaymentForm
          saldoPendiente={pendiente}
          submitLabel="Registrar abono"
          onCancel={() => setMode("view")}
          onSubmit={async (values) => {
            setError(null);
            try {
              await agregarAbonoVenta(eventId, localityId, sale.id, values, sale.montoTotal);
              setMode("view");
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo registrar el abono");
            }
          }}
        />
      ) : (
        pendiente > 0 && (
          <div className="mb-4">
            <button onClick={() => setMode("abonar")} className={buttonPrimaryClass}>
              Agregar abono
            </button>
          </div>
        )
      )}

      {error && <p className="mb-3 text-sm text-status-critical">{error}</p>}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-text-primary">Historial de abonos</h3>
        <PaymentHistoryList payments={payments} onEdit={setEditingPayment} />
      </div>

      {editingPayment && (
        <Modal title="Editar abono" onClose={() => setEditingPayment(null)}>
          <PaymentForm
            saldoPendiente={pendiente}
            submitLabel="Guardar cambios"
            initialValues={{
              monto: editingPayment.monto,
              fecha: editingPayment.fecha,
              metodo: editingPayment.metodo,
              nota: editingPayment.nota,
            }}
            onCancel={() => setEditingPayment(null)}
            onSubmit={async (values) => {
              setEditError(null);
              try {
                await editarAbonoVenta(eventId, localityId, sale.id, editingPayment.id, values, sale.montoTotal);
                setEditingPayment(null);
              } catch (e) {
                setEditError(e instanceof Error ? e.message : "No se pudo editar el abono");
              }
            }}
          />
          {editError && <p className="mt-3 text-sm text-status-critical">{editError}</p>}
        </Modal>
      )}

      {editingCantidad && (
        <Modal title="Editar cantidad de boletas" onClose={() => setEditingCantidad(false)}>
          <EditarCantidadBoletaForm
            cantidadActual={sale.cantidad}
            maxCantidad={maxCantidad}
            onCancel={() => setEditingCantidad(false)}
            onSubmit={async (values) => {
              setCantidadError(null);
              try {
                await editarCantidadVenta(eventId, localityId, sale.id, values.cantidad, aforoTotal);
                setEditingCantidad(false);
              } catch (e) {
                setCantidadError(e instanceof Error ? e.message : "No se pudo actualizar la cantidad");
              }
            }}
          />
          {cantidadError && <p className="mt-3 text-sm text-status-critical">{cantidadError}</p>}
        </Modal>
      )}
    </Modal>
  );
}
