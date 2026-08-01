import { useEffect, useState } from "react";
import { saldoPendiente } from "../lib/estado";
import { agregarAbonoBoletaPalco, listenPalcoBoletaSalePayments } from "../services/palcos";
import type { PalcoBoletaSale, Payment } from "../types";
import { EstadoBadge } from "./EstadoBadge";
import { Modal } from "./Modal";
import { PaymentForm } from "./PaymentForm";
import { PaymentHistoryList } from "./PaymentHistoryList";
import { PaymentProgress } from "./PaymentProgress";
import { buttonPrimaryClass } from "./form/FormField";

interface PalcoBoletaSaleDetailModalProps {
  eventId: string;
  localityId: string;
  palcoId: string;
  sale: PalcoBoletaSale;
  onClose: () => void;
}

export function PalcoBoletaSaleDetailModal({
  eventId,
  localityId,
  palcoId,
  sale,
  onClose,
}: PalcoBoletaSaleDetailModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [mode, setMode] = useState<"view" | "abonar">("view");
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => listenPalcoBoletaSalePayments(eventId, localityId, palcoId, sale.id, setPayments),
    [eventId, localityId, palcoId, sale.id],
  );

  const pendiente = saldoPendiente(sale.montoTotal, sale.montoAbonado);

  return (
    <Modal title={`Venta · ${sale.cantidad} boleta(s)`} onClose={onClose}>
      <div className="mb-4 flex items-center gap-2">
        <EstadoBadge estado={sale.estado} />
      </div>

      <div className="mb-4 rounded-lg border border-gridline p-3 text-sm">
        <p className="font-medium text-text-primary">{sale.comprador.nombre}</p>
        <p className="text-text-secondary">CC {sale.comprador.cedula}</p>
        <p className="text-text-secondary">{sale.comprador.telefono}</p>
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
              await agregarAbonoBoletaPalco(eventId, localityId, palcoId, sale.id, values, sale.montoTotal);
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
        <PaymentHistoryList payments={payments} />
      </div>
    </Modal>
  );
}
