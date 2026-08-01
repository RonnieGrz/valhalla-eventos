import { NavLink, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../hooks/useEvents";

export function Navbar() {
  const { eventId } = useParams();
  const { logout, user } = useAuth();
  const { events } = useEvents();
  const evento = eventId ? events.find((e) => e.id === eventId) : undefined;

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
      isActive ? "bg-series-1 text-white" : "text-text-secondary hover:bg-surface-2"
    }`;

  return (
    <header className="border-b border-gridline bg-surface-1">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <NavLink to="/" className="shrink-0 text-lg font-bold text-text-primary">
            Valhalla Eventos
          </NavLink>
          {eventId && (
            <>
              <span className="hidden text-text-muted sm:inline" aria-hidden="true">
                /
              </span>
              <span
                className="max-w-[16rem] truncate text-sm font-medium text-text-secondary"
                title={evento?.nombre}
              >
                {evento?.nombre ?? "Cargando..."}
              </span>
              <nav className="flex gap-1">
                <NavLink to={`/eventos/${eventId}`} end className={tabClass}>
                  Dashboard
                </NavLink>
                <NavLink to={`/eventos/${eventId}/localidades`} className={tabClass}>
                  Localidades
                </NavLink>
              </nav>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {user && <span className="hidden text-sm text-text-muted sm:inline">{user.email}</span>}
          <button
            onClick={() => logout()}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-2"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
