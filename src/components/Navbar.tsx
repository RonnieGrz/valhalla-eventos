import { NavLink, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../hooks/useEvents";

export function Navbar() {
  const { eventId } = useParams();
  const { logout, user } = useAuth();
  const { events } = useEvents();
  const evento = eventId ? events.find((e) => e.id === eventId) : undefined;

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
      isActive ? "bg-series-1 text-on-accent" : "text-text-secondary hover:bg-surface-2"
    }`;

  return (
    <header className="border-b border-gridline bg-surface-1">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <NavLink to="/" className="shrink-0">
          <img src="/logo.png" alt="Valhalla Eventos" className="brand-logo h-7 w-auto" />
        </NavLink>
        <div className="flex items-center gap-3">
          {user && <span className="hidden text-sm text-text-muted sm:inline">{user.email}</span>}
          <button
            onClick={() => logout()}
            className="inline-flex min-h-11 items-center rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-surface-2"
          >
            Salir
          </button>
        </div>
      </div>

      {eventId && (
        <div className="border-t border-gridline">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-x-2">
              <NavLink
                to="/"
                className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 py-1 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-surface-2"
              >
                Eventos
              </NavLink>
              <span className="shrink-0 text-text-muted" aria-hidden="true">
                /
              </span>
              <span
                className="max-w-[9rem] truncate text-sm font-medium text-text-secondary sm:max-w-[16rem]"
                title={evento?.nombre}
              >
                {evento?.nombre ?? "Cargando..."}
              </span>
            </div>
            <nav className="flex gap-1 sm:ml-auto">
              <NavLink to={`/eventos/${eventId}`} end className={tabClass}>
                Dashboard
              </NavLink>
              <NavLink to={`/eventos/${eventId}/localidades`} className={tabClass}>
                Localidades
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
