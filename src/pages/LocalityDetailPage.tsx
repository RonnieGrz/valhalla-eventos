import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BoletaSaleDetailModal } from "../components/BoletaSaleDetailModal";
import { BoletaSaleList } from "../components/BoletaSaleList";
import { Navbar } from "../components/Navbar";
import { PalcoDetailModal } from "../components/PalcoDetailModal";
import { PalcoGrid } from "../components/PalcoGrid";
import { VentaBoletasForm } from "../components/VentaBoletasForm";
import { buttonPrimaryClass, inputClass } from "../components/form/FormField";
import { Modal } from "../components/Modal";
import { aforoRestante } from "../lib/estado";
import { palcoMatchesQuery, ventaMatchesQuery } from "../lib/search";
import { useLocalities } from "../hooks/useLocalities";
import { useLocalityDetail } from "../hooks/useLocalityDetail";
import { crearVentaBoletas } from "../services/boletaSales";

export function LocalityDetailPage() {
  const { eventId, localityId } = useParams<{ eventId: string; localityId: string }>();
  const { localities } = useLocalities(eventId);
  const { palcos, boletaSales, loading } = useLocalityDetail(eventId, localityId);
  const [selectedPalcoId, setSelectedPalcoId] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [showVentaForm, setShowVentaForm] = useState(false);
  const [ventaError, setVentaError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const localidad = localities.find((l) => l.id === localityId);
  // Se re-deriva de la lista en vivo (no de una copia guardada) para que el modal
  // refleje abonos/estado nuevos sin tener que cerrarlo y volver a abrirlo.
  const selectedPalco = palcos.find((p) => p.id === selectedPalcoId) ?? null;
  const selectedSale = boletaSales.find((s) => s.id === selectedSaleId) ?? null;

  if (!eventId || !localityId) return null;

  const restante = localidad ? aforoRestante(localidad.boletasConfig.aforo, boletaSales) : 0;
  const filteredPalcos = palcos.filter((p) => palcoMatchesQuery(p, query));
  const filteredSales = boletaSales.filter((s) => ventaMatchesQuery(s, query));

  return (
    <div className="min-h-screen bg-surface-2">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link
          to={`/eventos/${eventId}/localidades`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-series-1"
        >
          ← Localidades
        </Link>
        <h1 className="mb-6 font-display text-2xl font-bold text-text-primary">
          {localidad?.nombre ?? "Localidad"}
        </h1>

        {loading && <p className="text-text-muted">Cargando...</p>}

        {!loading &&
          localidad &&
          (localidad.palcosConfig.cantidad > 0 || localidad.boletasConfig.aforo > 0) && (
            <div className="mb-6">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por número de palco, cédula o nombre del comprador"
                className={inputClass}
                aria-label="Buscar palco o venta de boletas"
              />
            </div>
          )}

        {!loading && localidad && localidad.palcosConfig.cantidad > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">Palcos</h2>
            {query && filteredPalcos.length === 0 ? (
              <p className="text-sm text-text-muted">Ningún palco coincide con "{query}".</p>
            ) : (
              <PalcoGrid palcos={filteredPalcos} onSelect={(p) => setSelectedPalcoId(p.id)} />
            )}
          </section>
        )}

        {!loading && localidad && localidad.boletasConfig.aforo > 0 && (
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-text-primary">
                Boletas sueltas · {restante} disponibles
              </h2>
              <button
                onClick={() => setShowVentaForm(true)}
                disabled={restante === 0}
                className={buttonPrimaryClass}
              >
                + Vender boletas
              </button>
            </div>
            {query && filteredSales.length === 0 ? (
              <p className="text-sm text-text-muted">
                Ninguna venta coincide con "{query}".
              </p>
            ) : (
              <BoletaSaleList sales={filteredSales} onSelect={(s) => setSelectedSaleId(s.id)} />
            )}
          </section>
        )}
      </main>

      {selectedPalco && (
        <PalcoDetailModal
          eventId={eventId}
          localityId={localityId}
          palco={selectedPalco}
          onClose={() => setSelectedPalcoId(null)}
        />
      )}

      {selectedSale && (
        <BoletaSaleDetailModal
          eventId={eventId}
          localityId={localityId}
          sale={selectedSale}
          onClose={() => setSelectedSaleId(null)}
        />
      )}

      {showVentaForm && localidad && (
        <Modal title="Vender boletas sueltas" onClose={() => setShowVentaForm(false)} widthClass="max-w-lg">
          <VentaBoletasForm
            precioUnitario={localidad.boletasConfig.precioUnitario}
            aforoRestante={restante}
            onCancel={() => setShowVentaForm(false)}
            onSubmit={async (values) => {
              setVentaError(null);
              try {
                await crearVentaBoletas(
                  eventId,
                  localityId,
                  { nombre: values.nombre, cedula: values.cedula, telefono: values.telefono },
                  values.cantidad,
                  localidad.boletasConfig.precioUnitario,
                  localidad.boletasConfig.aforo,
                  { monto: values.monto, fecha: values.fecha, metodo: values.metodo, nota: values.nota ?? "" },
                );
                setShowVentaForm(false);
              } catch (e) {
                setVentaError(e instanceof Error ? e.message : "No se pudo registrar la venta");
              }
            }}
          />
          {ventaError && <p className="mt-3 text-sm text-status-critical">{ventaError}</p>}
        </Modal>
      )}
    </div>
  );
}
