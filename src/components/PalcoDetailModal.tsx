import { useEffect, useState } from "react";
import { saldoPendiente } from "../lib/estado";
import { formatCOP } from "../lib/format";
import {
  agregarAbonoPalco,
  liberarPalco,
  listenPalcoBoletaSales,
  listenPalcoPayments,
  reservarPalco,
  venderBoletaPalco,
} from "../services/palcos";
import type { Palco, PalcoBoletaSale, Payment } from "../types";
import { BoletaSaleList } from "./BoletaSaleList";
import { ConfirmDialog } from "./ConfirmDialog";
import { EstadoBadge } from "./EstadoBadge";
import { Modal } from "./Modal";
import { PalcoBoletaSaleDetailModal } from "./PalcoBoletaSaleDetailModal";
import { PaymentForm } from "./PaymentForm";
import { PaymentHistoryList } from "./PaymentHistoryList";
import { PaymentProgress } from "./PaymentProgress";
import { ReservarPalcoForm } from "./ReservarPalcoForm";
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

  // --- Palco disponible: si admite boleta suelta, hay que elegir cómo venderlo ---
  if (palco.estado === "disponible") {
    if (!palco.vendiblePorBoleta) {
      return (
        <Modal title={`Palco ${palco.numero}`} onClose={onClose}>
          <p className="mb-4 text-sm text-text-secondary">
            Capacidad {palco.capacidad} · Precio {formatCOP(palco.precio)}
          </p>
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
          {error && <p className="mt-3 text-sm text-status-critical">{error}</p>}
        </Modal>
      );
    }

    return (
      <Modal title={`Palco ${palco.numero}`} onClose={onClose}>
        <p className="mb-4 text-sm text-text-secondary">
          Capacidad {palco.capacidad} · Palco completo {formatCOP(palco.precio)} · Boleta suelta{" "}
          {formatCOP(palco.precioBoleta)} c/u
        </p>

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

        {error && <p className="mt-3 text-sm text-status-critical">{error}</p>}
      </Modal>
    );
  }

  // --- Palco vendido por boleta suelta: varios compradores dentro del mismo palco ---
  if (esModoBoletaSuelta) {
    const restante = palco.capacidad - palco.boletasVendidas;
    return (
      <>
        <Modal title={`Palco ${palco.numero} · boletas sueltas`} onClose={onClose}>
          <div className="mb-4 flex items-center gap-2">
            <EstadoBadge estado={palco.estado} />
            <span className="text-sm text-text-muted">
              {palco.boletasVendidas} / {palco.capacidad} asientos vendidos
            </span>
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
            onClose={() => setSelectedSaleId(null)}
          />
        )}
      </>
    );
  }

  // --- Palco reservado completo (un solo comprador) ---
  const pendiente = saldoPendiente(palco.precio, palco.montoAbonado);

  return (
    <Modal title={`Palco ${palco.numero}`} onClose={onClose}>
      <div className="mb-4 flex items-center gap-2">
        <EstadoBadge estado={palco.estado} />
        <span className="text-sm text-text-muted">Capacidad {palco.capacidad}</span>
      </div>

      {palco.comprador && (
        <div className="mb-4 rounded-lg border border-gridline p-3 text-sm">
          <p className="font-medium text-text-primary">{palco.comprador.nombre}</p>
          <p className="text-text-secondary">CC {palco.comprador.cedula}</p>
          <p className="text-text-secondary">{palco.comprador.telefono}</p>
        </div>
      )}

      <div className="mb-4">
        <PaymentProgress montoTotal={palco.precio} montoAbonado={palco.montoAbonado} />
      </div>

      {mode === "abonar" ? (
        <PaymentForm
          saldoPendiente={pendiente}
          submitLabel="Registrar abono"
          onCancel={() => setMode("view")}
          onSubmit={async (values) => {
            setError(null);
            try {
              await agregarAbonoPalco(eventId, localityId, palco.id, values, palco.precio);
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
          {palco.montoAbonado === 0 && (
            <button onClick={() => setConfirmLiberar(true)} className={buttonDangerClass}>
              Liberar palco
            </button>
          )}
        </div>
      )}

      {error && <p className="mb-3 text-sm text-status-critical">{error}</p>}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-text-primary">Historial de abonos</h3>
        <PaymentHistoryList payments={payments} />
      </div>

      {confirmLiberar && (
        <ConfirmDialog
          title="Liberar palco"
          message="¿Liberar este palco? Volverá a estar disponible."
          confirmLabel={liberando ? "Liberando..." : "Liberar"}
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
