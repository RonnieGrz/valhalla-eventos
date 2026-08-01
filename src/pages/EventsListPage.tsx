import { useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EventCard } from "../components/EventCard";
import { EventForm } from "../components/EventForm";
import { Navbar } from "../components/Navbar";
import { buttonPrimaryClass } from "../components/form/FormField";
import { useEvents } from "../hooks/useEvents";
import { createEvent, deleteEvent } from "../services/events";
import type { Evento } from "../types";

export function EventsListPage() {
  const { events, loading } = useEvents();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventoToDelete, setEventoToDelete] = useState<Evento | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!eventoToDelete) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteEvent(eventoToDelete.id);
      setEventoToDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar el evento");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-2">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">Eventos</h1>
          <button onClick={() => setShowForm(true)} className={buttonPrimaryClass}>
            + Nuevo evento
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-md bg-status-critical/10 px-3 py-2 text-sm text-status-critical">
            {error}
          </p>
        )}

        {loading && <p className="text-text-muted">Cargando eventos...</p>}

        {!loading && events.length === 0 && (
          <div className="rounded-xl border border-dashed border-gridline p-10 text-center text-text-muted">
            Aún no hay eventos. Crea el primero para empezar a vender.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((evento) => (
            <EventCard
              key={evento.id}
              evento={evento}
              onDelete={() => setEventoToDelete(evento)}
            />
          ))}
        </div>
      </main>

      {eventoToDelete && (
        <ConfirmDialog
          title="Eliminar evento"
          message={`¿Eliminar el evento "${eventoToDelete.nombre}" y todos sus datos? Esta acción no se puede deshacer.`}
          confirmLabel={deleting ? "Eliminando..." : "Eliminar"}
          confirmDisabled={deleting}
          onCancel={() => setEventoToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}

      {showForm && (
        <EventForm
          onClose={() => setShowForm(false)}
          onSubmit={async (values) => {
            await createEvent({
              nombre: values.nombre,
              lugar: values.lugar,
              fecha: values.fecha,
              descripcion: values.descripcion ?? "",
            });
          }}
        />
      )}
    </div>
  );
}
