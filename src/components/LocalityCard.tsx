import { Link } from "react-router-dom";
import { formatCOP } from "../lib/format";
import type { Localidad } from "../types";
import { buttonSecondaryClass } from "./form/FormField";

interface LocalityCardProps {
  eventId: string;
  localidad: Localidad;
  onAddPalcos: () => void;
  onDelete: () => void;
}

export function LocalityCard({ eventId, localidad, onAddPalcos, onDelete }: LocalityCardProps) {
  const { palcosConfig, boletasConfig } = localidad;

  return (
    <div className="rounded-xl border border-gridline bg-surface-1 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate text-lg font-semibold text-text-primary">
          {localidad.nombre}
        </h3>
        <button
          onClick={onDelete}
          className="shrink-0 rounded-md px-2 py-1.5 text-sm font-medium text-status-critical hover:bg-status-critical/10"
        >
          Eliminar
        </button>
      </div>

      <div className="mb-4 space-y-1 text-sm text-text-secondary">
        {palcosConfig.cantidad > 0 && (
          <p>
            <span className="font-medium text-text-primary">{palcosConfig.cantidad} palcos</span>{" "}
            · capacidad {palcosConfig.capacidadPorPalco} · {formatCOP(palcosConfig.precio)} c/u
          </p>
        )}
        {boletasConfig.aforo > 0 && (
          <p>
            <span className="font-medium text-text-primary">{boletasConfig.aforo} boletas</span>{" "}
            sueltas · {formatCOP(boletasConfig.precioUnitario)} c/u
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to={`/eventos/${eventId}/localidades/${localidad.id}`}
          className="rounded-md bg-series-1 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          Ver palcos y boletas
        </Link>
        {palcosConfig.cantidad > 0 && (
          <button onClick={onAddPalcos} className={`${buttonSecondaryClass} px-3 py-1.5 text-sm`}>
            + Agregar palcos
          </button>
        )}
      </div>
    </div>
  );
}
