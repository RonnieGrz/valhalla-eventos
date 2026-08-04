import type { ReactNode } from "react";
import type { Palco } from "../types";

const estadoClasses: Record<Palco["estado"], string> = {
  disponible: "border-gridline bg-surface-1 text-text-secondary hover:border-series-1",
  separado: "border-status-warning bg-status-warning/15 text-status-warning",
  vendido: "border-status-good bg-status-good/15 text-status-good",
};

const estadoLabel: Record<Palco["estado"], string> = {
  disponible: "disponible",
  separado: "separado",
  vendido: "vendido",
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
        <LegendItem
          colorClass="bg-status-warning"
          label="Separado"
          icon={<ClockIcon className="h-2.5 w-2.5 text-on-accent" />}
        />
        <LegendItem
          colorClass="bg-status-good"
          label="Vendido"
          icon={<CheckIcon className="h-2.5 w-2.5 text-on-accent" />}
        />
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
            aria-label={`Palco ${palco.numero}, ${estadoLabel[palco.estado]}${
              palco.vendiblePorBoleta ? ", también vendible por boleta suelta" : ""
            }`}
            className={`relative aspect-square rounded-lg border-2 text-sm font-semibold transition duration-150 ease-out-strong active:scale-90 ${estadoClasses[palco.estado]}`}
          >
            {palco.numero}
            {palco.estado !== "disponible" && (
              <span className="absolute bottom-1 left-1" aria-hidden="true">
                {palco.estado === "separado" ? (
                  <ClockIcon className="h-2.5 w-2.5" />
                ) : (
                  <CheckIcon className="h-2.5 w-2.5" />
                )}
              </span>
            )}
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

function LegendItem({
  colorClass,
  label,
  icon,
}: {
  colorClass: string;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`flex h-3 w-3 items-center justify-center rounded ${colorClass}`}>{icon}</span>
      {label}
    </span>
  );
}

/** Non-color indicator for "separado": estado must be legible without relying on color alone (WCAG 1.4.1). */
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" className={className} aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 3.2V6l2 1.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Non-color indicator for "vendido": estado must be legible without relying on color alone (WCAG 1.4.1). */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" className={className} aria-hidden="true">
      <path
        d="M2.5 6.2L5 8.7L9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
