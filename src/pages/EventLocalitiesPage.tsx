import { useState } from "react";
import { useParams } from "react-router-dom";
import { AddPalcosForm } from "../components/AddPalcosForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { buttonPrimaryClass } from "../components/form/FormField";
import { LocalityCard } from "../components/LocalityCard";
import { LocalityForm } from "../components/LocalityForm";
import { Navbar } from "../components/Navbar";
import { useLocalities } from "../hooks/useLocalities";
import {
  addPalcosToLocality,
  createLocality,
  deleteLocality,
} from "../services/localities";
import type { Localidad } from "../types";

export function EventLocalitiesPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { localities, loading } = useLocalities(eventId);
  const [showForm, setShowForm] = useState(false);
  const [addPalcosFor, setAddPalcosFor] = useState<Localidad | null>(null);
  const [localidadToDelete, setLocalidadToDelete] = useState<Localidad | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!eventId) return null;

  async function confirmDelete() {
    if (!eventId || !localidadToDelete) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteLocality(eventId, localidadToDelete.id);
      setLocalidadToDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar la localidad");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-2">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-2xl font-bold text-text-primary">Localidades</h1>
          <button onClick={() => setShowForm(true)} className={buttonPrimaryClass}>
            + Nueva localidad
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-md bg-status-critical/10 px-3 py-2 text-sm text-status-critical">
            {error}
          </p>
        )}

        {loading && <p className="text-text-muted">Cargando localidades...</p>}

        {!loading && localities.length === 0 && (
          <div className="rounded-xl border border-dashed border-gridline p-10 text-center text-text-muted">
            Aún no hay localidades. Crea la primera (palcos, boletas sueltas, o ambas).
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {localities.map((localidad) => (
            <LocalityCard
              key={localidad.id}
              eventId={eventId}
              localidad={localidad}
              onAddPalcos={() => setAddPalcosFor(localidad)}
              onDelete={() => setLocalidadToDelete(localidad)}
            />
          ))}
        </div>
      </main>

      {localidadToDelete && (
        <ConfirmDialog
          title="Eliminar localidad"
          message={`¿Eliminar la localidad "${localidadToDelete.nombre}" y todos sus datos? Esta acción no se puede deshacer.`}
          confirmLabel={deleting ? "Eliminando..." : "Eliminar"}
          confirmDisabled={deleting}
          onCancel={() => setLocalidadToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}

      {showForm && (
        <LocalityForm
          onClose={() => setShowForm(false)}
          onSubmit={async (values) => {
            await createLocality(
              eventId,
              {
                nombre: values.nombre,
                palcosConfig: {
                  cantidad: values.tienePalcos ? values.palcosCantidad : 0,
                  capacidadPorPalco: values.tienePalcos ? values.palcosCapacidad : 0,
                  precio: values.tienePalcos ? values.palcosPrecio : 0,
                },
                boletasConfig: {
                  aforo: values.tieneBoletas ? values.boletasAforo : 0,
                  precioUnitario: values.tieneBoletas ? values.boletasPrecio : 0,
                },
              },
              values.tienePalcos && values.palcosNumeracion === "manual"
                ? values.palcosNumeroInicial
                : undefined,
            );
          }}
        />
      )}

      {addPalcosFor && (
        <AddPalcosForm
          localidad={addPalcosFor}
          onClose={() => setAddPalcosFor(null)}
          onSubmit={async (values) => {
            await addPalcosToLocality(
              eventId,
              addPalcosFor.id,
              values.cantidad,
              values.capacidad,
              values.precio,
              values.numeracion === "manual" ? values.numeroInicial : undefined,
            );
          }}
        />
      )}
    </div>
  );
}
