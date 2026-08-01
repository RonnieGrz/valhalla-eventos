import { formatCOP, formatFecha } from "../lib/format";
import type { Payment } from "../types";

const metodoLabel: Record<Payment["metodo"], string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

export function PaymentHistoryList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return <p className="text-sm text-text-muted">Sin abonos registrados aún.</p>;
  }

  return (
    <ul className="divide-y divide-gridline">
      {payments.map((p) => (
        <li key={p.id} className="flex items-center justify-between py-2 text-sm">
          <div>
            <p className="font-medium text-text-primary">{formatCOP(p.monto)}</p>
            <p className="text-text-muted">
              {formatFecha(p.fecha)} · {metodoLabel[p.metodo]}
              {p.nota ? ` · ${p.nota}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
