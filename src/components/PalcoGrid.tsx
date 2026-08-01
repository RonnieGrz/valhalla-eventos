import type { Palco } from "../types";

const estadoClasses: Record<Palco["estado"], string> = {
  disponible: "border-gridline bg-surface-1 text-text-secondary hover:border-series-1",
  separado: "border-status-warning bg-status-warning/15 text-status-warning",
  vendido: "border-status-good bg-status-good/15 text-status-good",
};

interface PalcoGridProps {
  palcos: Palco[];
  onSelect: (palco: Palco) => void;
}

export function PalcoGrid({ palcos, onSelect }: PalcoGridProps) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-text-secondary">
        <LegendItem colorClass="bg-surface-1 border border-gridline" label="Disponible" />
        <LegendItem colorClass="bg-status-warning" label="Separado" />
        <LegendItem colorClass="bg-status-good" label="Vendido" />
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-series-1" aria-hidden="true" />
          También vendible por boleta suelta
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {palcos.map((palco) => (
          <button
            key={palco.id}
            onClick={() => onSelect(palco)}
            className={`relative aspect-square rounded-lg border-2 text-sm font-semibold transition ${estadoClasses[palco.estado]}`}
          >
            {palco.numero}
            {palco.vendiblePorBoleta && (
              <span
                className="absolute right-1 top-1 h-2 w-2 rounded-full bg-series-1"
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function LegendItem({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${colorClass}`} />
      {label}
    </span>
  );
}
