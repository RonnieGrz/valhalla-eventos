import type { EstadoVenta } from "../types";

// Tint opacity is tuned per status so text-on-tint clears WCAG AA (4.5:1) for
// text-xs in both themes — a lighter tint contrasts *more*, not less, against
// the status color used as text.
const estadoStyles: Record<EstadoVenta, string> = {
  disponible: "bg-status-neutral/12 text-status-neutral",
  separado: "bg-status-warning/14 text-status-warning",
  vendido: "bg-status-good/8 text-status-good",
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
