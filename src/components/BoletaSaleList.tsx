import { formatCOP } from "../lib/format";
import type { Comprador, EstadoVenta } from "../types";
import { EstadoBadge } from "./EstadoBadge";

/** Campos mínimos que necesita la lista: sirve tanto para BoletaSale (localidad) como PalcoBoletaSale. */
export interface SaleListItem {
  id: string;
  comprador: Comprador;
  cantidad: number;
  montoTotal: number;
  montoAbonado: number;
  estado: EstadoVenta;
}

interface BoletaSaleListProps<S extends SaleListItem> {
  sales: S[];
  onSelect: (sale: S) => void;
}

export function BoletaSaleList<S extends SaleListItem>({ sales, onSelect }: BoletaSaleListProps<S>) {
  if (sales.length === 0) {
    return <p className="text-sm text-text-muted">Aún no se han vendido boletas sueltas.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gridline">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 text-left text-text-secondary">
          <tr>
            <th className="px-3 py-2 font-medium">Comprador</th>
            <th className="px-3 py-2 font-medium">Cantidad</th>
            <th className="px-3 py-2 font-medium">Total</th>
            <th className="px-3 py-2 font-medium">Abonado</th>
            <th className="px-3 py-2 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gridline">
          {sales.map((sale) => (
            <tr
              key={sale.id}
              onClick={() => onSelect(sale)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(sale);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Ver venta de ${sale.comprador.nombre}`}
              className="cursor-pointer hover:bg-surface-2"
            >
              <td className="px-3 py-2 text-text-primary">{sale.comprador.nombre}</td>
              <td className="px-3 py-2 text-text-secondary">{sale.cantidad}</td>
              <td className="px-3 py-2 text-text-secondary">{formatCOP(sale.montoTotal)}</td>
              <td className="px-3 py-2 text-text-secondary">{formatCOP(sale.montoAbonado)}</td>
              <td className="px-3 py-2">
                <EstadoBadge estado={sale.estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
