import { formatCOP, formatFecha } from "../lib/format";
import type { Payment } from "../types";

const metodoLabel: Record<Payment["metodo"], string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

interface PaymentHistoryListProps {
  payments: Payment[];
  onEdit?: (payment: Payment) => void;
}

export function PaymentHistoryList({ payments, onEdit }: PaymentHistoryListProps) {
  if (payments.length === 0) {
    return <p className="text-sm text-text-muted">Sin abonos registrados aún.</p>;
  }

  return (
    <ul className="divide-y divide-gridline">
      {payments.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="font-medium text-text-primary">{formatCOP(p.monto)}</p>
            <p className="text-text-muted">
              {formatFecha(p.fecha)} · {metodoLabel[p.metodo]}
              {p.nota ? ` · ${p.nota}` : ""}
            </p>
          </div>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(p)}
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 py-2 text-sm font-medium text-series-1 transition duration-150 ease-out-strong hover:bg-surface-2 active:scale-[0.97]"
            >
              Editar
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
