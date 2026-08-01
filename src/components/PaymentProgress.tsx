import { formatCOP } from "../lib/format";
import { porcentajePagado, saldoPendiente } from "../lib/estado";

export function PaymentProgress({
  montoTotal,
  montoAbonado,
}: {
  montoTotal: number;
  montoAbonado: number;
}) {
  const pct = porcentajePagado(montoTotal, montoAbonado);
  const pendiente = saldoPendiente(montoTotal, montoAbonado);

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-text-secondary">
          Abonado {formatCOP(montoAbonado)} de {formatCOP(montoTotal)}
        </span>
        <span className="font-medium text-text-primary">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-status-good transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {pendiente > 0 && (
        <p className="mt-1 text-sm text-text-muted">Saldo pendiente: {formatCOP(pendiente)}</p>
      )}
    </div>
  );
}
