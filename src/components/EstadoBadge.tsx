import type { EstadoVenta } from "../types";

const estadoStyles: Record<EstadoVenta, string> = {
  disponible: "bg-status-neutral/15 text-status-neutral",
  separado: "bg-status-warning/20 text-status-warning",
  vendido: "bg-status-good/15 text-status-good",
};

const estadoLabel: Record<EstadoVenta, string> = {
  disponible: "Disponible",
  separado: "Separado",
  vendido: "Vendido",
};

export function EstadoBadge({ estado }: { estado: EstadoVenta }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estadoStyles[estado]}`}>
      {estadoLabel[estado]}
    </span>
  );
}
