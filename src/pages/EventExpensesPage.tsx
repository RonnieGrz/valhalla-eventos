import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatCard } from "../components/dashboard/StatCard";
import { inputClass } from "../components/form/FormField";
import { GastoForm } from "../components/GastoForm";
import { Modal } from "../components/Modal";
import { Navbar } from "../components/Navbar";
import { useExpenses } from "../hooks/useExpenses";
import { formatCOP, formatFecha } from "../lib/format";
import { createExpense, deleteExpense, updateExpense } from "../services/expenses";
import type { Gasto } from "../types";

export function EventExpensesPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { gastos, loading } = useExpenses(eventId);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Gasto | null>(null);
  const [toDelete, setToDelete] = useState<Gasto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => gastos.reduce((sum, g) => sum + g.monto, 0), [gastos]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? gastos.filter((g) => g.descripcion.toLowerCase().includes(q)) : gastos;
  }, [gastos, query]);
  const totalFiltrado = useMemo(() => filtered.reduce((sum, g) => sum + g.monto, 0), [filtered]);

  if (!eventId) return null;

  async function confirmDelete() {
    if (!eventId || !toDelete) return;
    setBusy(true);
    setError(null);
    try {
      await deleteExpense(eventId, toDelete.id);
      setToDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar el gasto");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-2">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 font-display text-2xl font-bold text-text-primary">Gastos</h1>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
          <StatCard label="Total gastado" value={formatCOP(total)} accentClass="text-status-critical" />
          <StatCard label="Gastos registrados" value={String(gastos.length)} />
        </div>

        <section className="mb-8 rounded-xl border border-gridline bg-surface-1 p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Registrar gasto</h2>
          <GastoForm submitLabel="Agregar gasto" onSubmit={(values) => createExpense(eventId, values)} />
        </section>

        {error && (
          <p className="mb-4 rounded-md bg-status-critical/10 px-3 py-2 text-sm text-status-critical">
            {error}
          </p>
        )}

        {loading && <p className="text-text-muted">Cargando gastos...</p>}

        {!loading && gastos.length === 0 && (
          <div className="rounded-xl border border-dashed border-gridline p-10 text-center text-text-muted">
            Aún no hay gastos. Registra el primero con el formulario de arriba.
          </div>
        )}

        {!loading && gastos.length > 0 && (
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-text-primary">Historial</h2>
              {query.trim() && (
                <span className="text-sm text-text-secondary">
                  {filtered.length} resultado{filtered.length === 1 ? "" : "s"} · {formatCOP(totalFiltrado)}
                </span>
              )}
            </div>
            {gastos.length > 5 && (
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por descripción"
                className={`${inputClass} mb-3`}
                aria-label="Buscar gasto por descripción"
              />
            )}
            {filtered.length === 0 ? (
              <p className="text-sm text-text-muted">Ningún gasto coincide con "{query}".</p>
            ) : (
              <ul className="divide-y divide-gridline overflow-hidden rounded-xl border border-gridline bg-surface-1">
                {filtered.map((g) => (
                  <li key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
                    <span className="w-24 shrink-0 text-sm text-text-secondary">{formatFecha(g.fecha)}</span>
                    <span className="min-w-0 flex-1 basis-40 break-words text-text-primary">
                      {g.descripcion}
                    </span>
                    <span className="font-display font-bold tabular-nums text-text-primary">
                      {formatCOP(g.monto)}
                    </span>
                    <span className="flex gap-1">
                      <button
                        onClick={() => setEditing(g)}
                        className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-series-1 hover:bg-surface-2"
                        aria-label={`Editar gasto ${g.descripcion}`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setToDelete(g)}
                        className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-status-critical hover:bg-status-critical/10"
                        aria-label={`Eliminar gasto ${g.descripcion}`}
                      >
                        Eliminar
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      {editing && (
        <Modal title="Editar gasto" onClose={() => setEditing(null)} widthClass="max-w-2xl">
          <GastoForm
            initialValues={{ fecha: editing.fecha, descripcion: editing.descripcion, monto: editing.monto }}
            submitLabel="Guardar cambios"
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await updateExpense(eventId, editing.id, values);
              setEditing(null);
            }}
          />
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar gasto"
          message={`¿Eliminar "${toDelete.descripcion}" por ${formatCOP(toDelete.monto)}? Esta acción no se puede deshacer.`}
          confirmLabel={busy ? "Eliminando..." : "Eliminar"}
          confirmDisabled={busy}
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
