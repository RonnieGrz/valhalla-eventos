import { useEffect, useState } from "react";
import { saldoPendiente } from "../lib/estado";
import { formatCOP } from "../lib/format";
import {
  actualizarSillasAdicionalesPalco,
  actualizarVendiblePorBoleta,
  agregarAbonoPalco,
  editarAbonoPalco,
  editarCapacidadPalco,
  editarCompradorPalco,
  liberarPalco,
  listenPalcoBoletaSales,
  listenPalcoPayments,
  reservarPalco,
  venderBoletaPalco,
} from "../services/palcos";
import type { Palco, PalcoBoletaSale, Payment } from "../types";
import { BoletaSaleList } from "./BoletaSaleList";
import { CompradorForm } from "./CompradorForm";
import { ConfirmDialog } from "./ConfirmDialog";
import { EditarCapacidadForm } from "./EditarCapacidadForm";
import { EstadoBadge } from "./EstadoBadge";
import { Modal } from "./Modal";
import { PalcoBoletaSaleDetailModal } from "./PalcoBoletaSaleDetailModal";
import { PalcoBoletaSettingsForm } from "./PalcoBoletaSettingsForm";
import { PaymentForm } from "./PaymentForm";
import { PaymentHistoryList } from "./PaymentHistoryList";
import { PaymentProgress } from "./PaymentProgress";
import { ReservarPalcoForm } from "./ReservarPalcoForm";
import { SillasAdicionalesForm } from "./SillasAdicionalesForm";
import { VentaBoletasForm } from "./VentaBoletasForm";
import { buttonDangerClass, buttonPrimaryClass, buttonSecondaryClass } from "./form/FormField";

interface PalcoDetailModalProps {
  eventId: string;
  localityId: string;
  palco: Palco;
  onClose: () => void;
}

export function PalcoDetailModal({ eventId, localityId, palco, onClose }: PalcoDetailModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [boletaSales, setBoletaSales] = useState<PalcoBoletaSale[]>([]);
  const [mode, setMode] = useState<"view" | "abonar">("view");
  const [ventaMode, setVentaMode] = useState<"elegir" | "completo" | "boletas">("elegir");
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [showVentaBoletaForm, setShowVentaBoletaForm] = useState(false);
  const [ventaBoletaError, setVentaBoletaError] = useState<string | null>(null);
  const [confirmLiberar, setConfirmLiberar] = useState(false);
  const [liberando, setLiberando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [editingComprador, setEditingComprador] = useState(false);
  const [compradorError, setCompradorError] = useState<string | null>(null);
  const [editingSillas, setEditingSillas] = useState(false);
  const [sillasError, setSillasError] = useState<string | null>(null);
  const [editingCapacidad, setEditingCapacidad] = useState(false);
  const [capacidadError, setCapacidadError] = useState<string | null>(null);

  useEffect(() => {
    if (palco.estado === "disponible") return;
    return listenPalcoPayments(eventId, localityId, palco.id, setPayments);
  }, [eventId, localityId, palco.id, palco.estado]);

  useEffect(() => {
    if (!palco.vendiblePorBoleta) return;
    return listenPalcoBoletaSales(eventId, localityId, palco.id, setBoletaSales);
  }, [eventId, localityId, palco.id, palco.vendiblePorBoleta]);

  const selectedSale = boletaSales.find((s) => s.id === selectedSaleId) ?? null;
  const esModoBoletaSuelta = palco.vendiblePorBoleta && palco.comprador === null && palco.boletasVendidas > 0;

  // --- Palco disponible: se puede decidir aquí si además admite boleta suelta ---
  if (palco.estado === "disponible") {
    return (
      <Modal title={`Palco ${palco.numero}`} onClose={onClose}>
        <div className="mb-4 flex items-center justify-between gap-2 text-sm text-text-secondary">
          <p>
            Capacidad {palco.capacidad} · Precio {formatCOP(palco.precio)}
            {palco.vendiblePorBoleta && ` · Boleta suelta ${formatCOP(palco.precioBoleta)} c/u`}
          </p>
          <button
            type="button"
            onClick={() => setEditingCapacidad(true)}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 py-1 text-sm font-medium text-series-1 transition duration-150 ease-out-strong hover:bg-surface-2 active:scale-[0.97]"
          >
            Editar cupo
          </button>
        </div>

        <PalcoBoletaSettingsForm
          vendiblePorBoleta={palco.vendiblePorBoleta}
          precioBoleta={palco.precioBoleta}
          onSubmit={async (values) => {
            setSettingsError(null);
            try {
              await actualizarVendiblePorBoleta(
                eventId,
                localityId,
                palco.id,
                values.vendiblePorBoleta,
                values.precioBoleta,
              );
              if (!values.vendiblePorBoleta) setVentaMode("elegir");
            } catch (e) {
              setSettingsError(e instanceof Error ? e.message : "No se pudo actualizar");
            }
          }}
        />
        {settingsError && <p className="mb-4 text-sm text-status-critical">{settingsError}</p>}

        {!palco.vendiblePorBoleta ? (
          <ReservarPalcoForm
            palco={palco}
            onCancel={onClose}
            onSubmit={async (values) => {
              setError(null);
              try {
                await reservarPalco(
                  eventId,
                  localityId,
                  palco.id,
                  { nombre: values.nombre, cedula: values.cedula, telefono: values.telefono },
                  { monto: values.monto, fecha: values.fecha, metodo: values.metodo, nota: values.nota ?? "" },
                  palco.precio,
                );
                onClose();
              } catch (e) {
                setError(e instanceof Error ? e.message : "No se pudo reservar el palco");
              }
            }}
          />
        ) : (
          <>
            {ventaMode === "elegir" && (
              <div className="flex flex-col gap-2">
                <button onClick={() => setVentaMode("completo")} className={buttonPrimaryClass}>
                  Reservar palco completo
                </button>
                <button onClick={() => setVentaMode("boletas")} className={buttonSecondaryClass}>
                  Vender boletas sueltas de este palco
                </button>
              </div>
            )}

            {ventaMode === "completo" && (
              <ReservarPalcoForm
                palco={palco}
                onCancel={() => setVentaMode("elegir")}
                onSubmit={async (values) => {
                  setError(null);
                  try {
                    await reservarPalco(
                      eventId,
                      localityId,
                      palco.id,
                      { nombre: values.nombre, cedula: values.cedula, telefono: values.telefono },
                      { monto: values.monto, fecha: values.fecha, metodo: values.metodo, nota: values.nota ?? "" },
                      palco.precio,
                    );
                    onClose();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "No se pudo reservar el palco");
                  }
                }}
              />
            )}

            {ventaMode === "boletas" && (
              <VentaBoletasForm
                precioUnitario={palco.precioBoleta}
                aforoRestante={palco.capacidad - palco.boletasVendidas}
                onCancel={() => setVentaMode("elegir")}
                onSubmit={async (values) => {
                  setError(null);
                  try {
                    await venderBoletaPalco(
                      eventId,
                      localityId,
                      palco.id,
                      { nombre: values.nombre, cedula: values.cedula, telefono: values.telefono },
                      values.cantidad,
                      { monto: values.monto, fecha: values.fecha, metodo: values.metodo, nota: values.nota ?? "" },
                    );
                    onClose();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "No se pudo registrar la venta");
                  }
                }}
              />
            )}
          </>
        )}

        {error && <p className="mt-3 text-sm text-status-critical">{error}</p>}

        {editingCapacidad && (
          <Modal title="Editar cupo del palco" onClose={() => setEditingCapacidad(false)}>
            <EditarCapacidadForm
              capacidadActual={palco.capacidad}
              minCapacidad={palco.boletasVendidas}
              onCancel={() => setEditingCapacidad(false)}
              onSubmit={async (values) => {
                setCapacidadError(null);
                try {
                  await editarCapacidadPalco(eventId, localityId, palco.id, values.capacidad);
                  setEditingCapacidad(false);
                } catch (e) {
                  setCapacidadError(e instanceof Error ? e.message : "No se pudo actualizar el cupo");
                }
              }}
            />
            {capacidadError && <p className="mt-3 text-sm text-status-critical">{capacidadError}</p>}
          </Modal>
        )}
      </Modal>
    );
  }

  // --- Palco vendido por boleta suelta: varios compradores dentro del mismo palco ---
  if (esModoBoletaSuelta) {
    const restante = palco.capacidad - palco.boletasVendidas;
    return (
      <>
        <Modal title={`Palco ${palco.numero} · boletas sueltas`} onClose={onClose}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <EstadoBadge estado={palco.estado} />
              <span className="text-sm text-text-muted">
                {palco.boletasVendidas} / {palco.capacidad} asientos vendidos
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditingCapacidad(true)}
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 py-1 text-sm font-medium text-series-1 transition duration-150 ease-out-strong hover:bg-surface-2 active:scale-[0.97]"
            >
              Editar cupo
            </button>
          </div>

          <div className="mb-4">
            <PaymentProgress
              montoTotal={palco.boletasVendidas * palco.precioBoleta}
              montoAbonado={palco.montoAbonado}
            />
          </div>

          {restante > 0 && (
            <button
              onClick={() => setShowVentaBoletaForm(true)}
              className={`${buttonPrimaryClass} mb-4`}
            >
              + Vender más boletas
            </button>
          )}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Compradores</h3>
            <BoletaSaleList sales={boletaSales} onSelect={(s) => setSelectedSaleId(s.id)} />
          </div>
        </Modal>

        {showVentaBoletaForm && (
          <Modal title="Vender boletas sueltas" onClose={() => setShowVentaBoletaForm(false)}>
            <VentaBoletasForm
              precioUnitario={palco.precioBoleta}
              aforoRestante={restante}
              onCancel={() => setShowVentaBoletaForm(false)}
              onSubmit={async (values) => {
                setVentaBoletaError(null);
                try {
                  await venderBoletaPalco(
                    eventId,
                    localityId,
                    palco.id,
                    { nombre: values.nombre, cedula: values.cedula, telefono: values.telefono },
                    values.cantidad,
                    { monto: values.monto, fecha: values.fecha, metodo: values.metodo, nota: values.nota ?? "" },
                  );
                  setShowVentaBoletaForm(false);
                } catch (e) {
                  setVentaBoletaError(e instanceof Error ? e.message : "No se pudo registrar la venta");
                }
              }}
            />
            {ventaBoletaError && <p className="mt-3 text-sm text-status-critical">{ventaBoletaError}</p>}
          </Modal>
        )}

        {selectedSale && (
          <PalcoBoletaSaleDetailModal
            eventId={eventId}
            localityId={localityId}
            palcoId={palco.id}
            sale={selectedSale}
            maxCantidad={palco.capacidad - palco.boletasVendidas + selectedSale.cantidad}
            onClose={() => setSelectedSaleId(null)}
          />
        )}

        {editingCapacidad && (
          <Modal title="Editar cupo del palco" onClose={() => setEditingCapacidad(false)}>
            <EditarCapacidadForm
              capacidadActual={palco.capacidad}
              minCapacidad={palco.boletasVendidas}
              onCancel={() => setEditingCapacidad(false)}
              onSubmit={async (values) => {
                setCapacidadError(null);
                try {
                  await editarCapacidadPalco(eventId, localityId, palco.id, values.capacidad);
                  setEditingCapacidad(false);
                } catch (e) {
                  setCapacidadError(e instanceof Error ? e.message : "No se pudo actualizar el cupo");
                }
              }}
            />
            {capacidadError && <p className="mt-3 text-sm text-status-critical">{capacidadError}</p>}
          </Modal>
        )}
      </>
    );
  }

  // --- Palco reservado completo (un solo comprador) ---
  const montoSillasAdicionales = palco.sillasAdicionalesVendidas * palco.precioSillaAdicional;
  const montoTotalPalco = palco.precio + montoSillasAdicionales;
  const pendiente = saldoPendiente(montoTotalPalco, palco.montoAbonado);
  const hayAlgunaSillaAdicional = palco.sillasAdicionalesVendidas > 0 || palco.sillasAdicionalesCortesia > 0;

  return (
    <Modal title={`Palco ${palco.numero}`} onClose={onClose}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <EstadoBadge estado={palco.estado} />
          <span className="text-sm text-text-muted">Capacidad {palco.capacidad}</span>
        </div>
        <button
          type="button"
          onClick={() => setEditingCapacidad(true)}
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 py-1 text-sm font-medium text-series-1 transition duration-150 ease-out-strong hover:bg-surface-2 active:scale-[0.97]"
        >
          Editar cupo
        </button>
      </div>

      {palco.comprador && (
        <div className="mb-4 flex items-start justify-between gap-2 rounded-lg border border-gridline p-3 text-sm">
          <div>
            <p className="font-medium text-text-primary">{palco.comprador.nombre}</p>
            <p className="text-text-secondary">CC {palco.comprador.cedula}</p>
            <p className="text-text-secondary">{palco.comprador.telefono}</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingComprador(true)}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 py-1 text-sm font-medium text-series-1 transition duration-150 ease-out-strong hover:bg-surface-2 active:scale-[0.97]"
          >
            Cambiar datos
          </button>
        </div>
      )}

      <div className="mb-4 flex items-start justify-between gap-2 rounded-lg border border-gridline p-3 text-sm">
        <div>
          <p className="font-medium text-text-primary">Sillas adicionales</p>
          {hayAlgunaSillaAdicional ? (
            <div className="text-text-secondary">
              {palco.sillasAdicionalesVendidas > 0 && (
                <p>
                  Vendidas: {palco.sillasAdicionalesVendidas} × {formatCOP(palco.precioSillaAdicional)} ={" "}
                  {formatCOP(montoSillasAdicionales)}
                </p>
              )}
              {palco.sillasAdicionalesCortesia > 0 && <p>Cortesía: {palco.sillasAdicionalesCortesia}</p>}
            </div>
          ) : (
            <p className="text-text-secondary">Ninguna</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditingSillas(true)}
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 py-1 text-sm font-medium text-series-1 transition duration-150 ease-out-strong hover:bg-surface-2 active:scale-[0.97]"
        >
          {hayAlgunaSillaAdicional ? "Editar" : "Agregar"}
        </button>
      </div>

      <div className="mb-4">
        <PaymentProgress montoTotal={montoTotalPalco} montoAbonado={palco.montoAbonado} />
      </div>

      {mode === "abonar" ? (
        <PaymentForm
          saldoPendiente={pendiente}
          submitLabel="Registrar abono"
          onCancel={() => setMode("view")}
          onSubmit={async (values) => {
            setError(null);
            try {
              await agregarAbonoPalco(eventId, localityId, palco.id, values, montoTotalPalco);
              setMode("view");
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo registrar el abono");
            }
          }}
        />
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {pendiente > 0 && (
            <button onClick={() => setMode("abonar")} className={buttonPrimaryClass}>
              Agregar abono
            </button>
          )}
          <button onClick={() => setConfirmLiberar(true)} className={buttonDangerClass}>
            Cancelar reserva
          </button>
        </div>
      )}

      {error && <p className="mb-3 text-sm text-status-critical">{error}</p>}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-text-primary">Historial de abonos</h3>
        <PaymentHistoryList payments={payments} onEdit={setEditingPayment} />
      </div>

      {editingPayment && (
        <Modal title="Editar abono" onClose={() => setEditingPayment(null)}>
          <PaymentForm
            saldoPendiente={pendiente}
            submitLabel="Guardar cambios"
            initialValues={{
              monto: editingPayment.monto,
              fecha: editingPayment.fecha,
              metodo: editingPayment.metodo,
              nota: editingPayment.nota,
            }}
            onCancel={() => setEditingPayment(null)}
            onSubmit={async (values) => {
              setEditError(null);
              try {
                await editarAbonoPalco(eventId, localityId, palco.id, editingPayment.id, values, montoTotalPalco);
                setEditingPayment(null);
              } catch (e) {
                setEditError(e instanceof Error ? e.message : "No se pudo editar el abono");
              }
            }}
          />
          {editError && <p className="mt-3 text-sm text-status-critical">{editError}</p>}
        </Modal>
      )}

      {editingComprador && palco.comprador && (
        <Modal title="Cambiar datos del comprador" onClose={() => setEditingComprador(false)}>
          <CompradorForm
            initialValues={palco.comprador}
            onCancel={() => setEditingComprador(false)}
            onSubmit={async (values) => {
              setCompradorError(null);
              try {
                await editarCompradorPalco(eventId, localityId, palco.id, values);
                setEditingComprador(false);
              } catch (e) {
                setCompradorError(e instanceof Error ? e.message : "No se pudieron guardar los cambios");
              }
            }}
          />
          {compradorError && <p className="mt-3 text-sm text-status-critical">{compradorError}</p>}
        </Modal>
      )}

      {editingSillas && (
        <Modal title="Sillas adicionales" onClose={() => setEditingSillas(false)}>
          <SillasAdicionalesForm
            initialValues={{
              sillasAdicionalesVendidas: palco.sillasAdicionalesVendidas,
              sillasAdicionalesCortesia: palco.sillasAdicionalesCortesia,
              precioSillaAdicional: palco.precioSillaAdicional,
            }}
            onCancel={() => setEditingSillas(false)}
            onSubmit={async (values) => {
              setSillasError(null);
              try {
                await actualizarSillasAdicionalesPalco(
                  eventId,
                  localityId,
                  palco.id,
                  values.sillasAdicionalesVendidas,
                  values.sillasAdicionalesCortesia,
                  values.precioSillaAdicional,
                );
                setEditingSillas(false);
              } catch (e) {
                setSillasError(e instanceof Error ? e.message : "No se pudieron guardar los cambios");
              }
            }}
          />
          {sillasError && <p className="mt-3 text-sm text-status-critical">{sillasError}</p>}
        </Modal>
      )}

      {editingCapacidad && (
        <Modal title="Editar cupo del palco" onClose={() => setEditingCapacidad(false)}>
          <EditarCapacidadForm
            capacidadActual={palco.capacidad}
            minCapacidad={palco.boletasVendidas}
            onCancel={() => setEditingCapacidad(false)}
            onSubmit={async (values) => {
              setCapacidadError(null);
              try {
                await editarCapacidadPalco(eventId, localityId, palco.id, values.capacidad);
                setEditingCapacidad(false);
              } catch (e) {
                setCapacidadError(e instanceof Error ? e.message : "No se pudo actualizar el cupo");
              }
            }}
          />
          {capacidadError && <p className="mt-3 text-sm text-status-critical">{capacidadError}</p>}
        </Modal>
      )}

      {confirmLiberar && (
        <ConfirmDialog
          title="Cancelar reserva"
          message={
            palco.montoAbonado > 0
              ? `Este palco tiene ${formatCOP(palco.montoAbonado)} abonados. Si cancelas la reserva, ese historial de abonos se borrará y el palco quedará disponible de nuevo. Esta acción no se puede deshacer.`
              : "¿Cancelar esta reserva? El palco volverá a estar disponible."
          }
          confirmLabel={liberando ? "Cancelando..." : "Cancelar reserva"}
          confirmDisabled={liberando}
          onCancel={() => setConfirmLiberar(false)}
          onConfirm={async () => {
            setLiberando(true);
            try {
              await liberarPalco(eventId, localityId, palco.id);
              onClose();
            } finally {
              setLiberando(false);
            }
          }}
        />
      )}
    </Modal>
  );
}
