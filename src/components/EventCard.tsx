import { Link } from "react-router-dom";
import { formatFecha } from "../lib/format";
import type { Evento } from "../types";

interface EventCardProps {
  evento: Evento;
  onEdit: () => void;
  onDelete: () => void;
}

export function EventCard({ evento, onEdit, onDelete }: EventCardProps) {
  return (
    <div className="rounded-xl border border-gridline bg-surface-1 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-series-1 hover:shadow-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Link to={`/eventos/${evento.id}`} className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-semibold text-text-primary">
            {evento.nombre}
          </h3>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              evento.estado === "activo"
                ? "bg-status-good/8 text-status-good"
                : "bg-status-neutral/12 text-status-neutral"
            }`}
          >
            {evento.estado === "activo" ? "Activo" : "Finalizado"}
          </span>
          <button
            onClick={onEdit}
            className="inline-flex min-h-11 items-center rounded-lg px-2 py-1.5 text-sm font-medium text-series-1 transition duration-150 ease-out-strong hover:bg-surface-2 active:scale-[0.97]"
            aria-label="Editar evento"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="inline-flex min-h-11 items-center rounded-lg px-2 py-1.5 text-sm font-medium text-status-critical transition duration-150 ease-out-strong hover:bg-status-critical/10 active:scale-[0.97]"
            aria-label="Eliminar evento"
          >
            Eliminar
          </button>
        </div>
      </div>
      <Link to={`/eventos/${evento.id}`} className="block">
        <p className="text-sm text-text-secondary">{evento.lugar}</p>
        <p className="text-sm text-text-muted">{formatFecha(evento.fecha)}</p>
      </Link>
    </div>
  );
}
