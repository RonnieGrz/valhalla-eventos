import {
  collection,
  collectionGroup,
  doc,
  DocumentReference,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { computeEstado } from "../lib/estado";
import type { MetodoPago, Payment, PaymentDoc } from "../types";

export interface NuevoAbono {
  monto: number;
  fecha: string;
  metodo: MetodoPago;
  nota: string;
}

/**
 * Registra un abono sobre un palco o una venta de boletas: crea el payment y,
 * en la misma transacción, incrementa montoAbonado y recalcula estado.
 */
export async function registrarAbono(
  parentRef: DocumentReference,
  eventId: string,
  localidadId: string,
  abono: NuevoAbono,
  montoTotal: number,
) {
  await runTransaction(db, async (tx) => {
    const parentSnap = await tx.get(parentRef);
    if (!parentSnap.exists()) throw new Error("El registro ya no existe");

    const montoAbonadoActual = (parentSnap.data().montoAbonado as number) ?? 0;
    const nuevoMontoAbonado = montoAbonadoActual + abono.monto;
    const nuevoEstado = computeEstado(nuevoMontoAbonado, montoTotal);

    const paymentRef = doc(collection(parentRef, "payments"));
    tx.set(paymentRef, {
      monto: abono.monto,
      fecha: abono.fecha,
      metodo: abono.metodo,
      nota: abono.nota,
      createdAt: Date.now(),
      eventId,
      localidadId,
    } satisfies PaymentDoc);

    tx.update(parentRef, {
      montoAbonado: nuevoMontoAbonado,
      estado: nuevoEstado,
      updatedAt: Date.now(),
    });
  });
}

/**
 * Edita un abono ya registrado: ajusta el payment y, en la misma transacción,
 * corrige montoAbonado/estado del padre por la diferencia entre el monto viejo y el nuevo.
 */
export async function editarAbono(
  parentRef: DocumentReference,
  paymentRef: DocumentReference,
  cambios: NuevoAbono,
  montoTotal: number,
) {
  await runTransaction(db, async (tx) => {
    const parentSnap = await tx.get(parentRef);
    const paymentSnap = await tx.get(paymentRef);
    if (!parentSnap.exists()) throw new Error("El registro ya no existe");
    if (!paymentSnap.exists()) throw new Error("El abono ya no existe");

    const montoAnterior = (paymentSnap.data().monto as number) ?? 0;
    const montoAbonadoActual = (parentSnap.data().montoAbonado as number) ?? 0;
    const nuevoMontoAbonado = montoAbonadoActual - montoAnterior + cambios.monto;
    const nuevoEstado = computeEstado(nuevoMontoAbonado, montoTotal);

    tx.update(paymentRef, {
      monto: cambios.monto,
      fecha: cambios.fecha,
      metodo: cambios.metodo,
      nota: cambios.nota,
    });

    tx.update(parentRef, {
      montoAbonado: nuevoMontoAbonado,
      estado: nuevoEstado,
      updatedAt: Date.now(),
    });
  });
}

export function paymentRef(parentRef: DocumentReference, paymentId: string) {
  return doc(parentRef, "payments", paymentId);
}

/** Todos los abonos del evento (palcos + boletas), para el gráfico de recaudo en el tiempo. */
export function listenEventPayments(eventId: string, cb: (payments: Payment[]) => void) {
  const q = query(
    collectionGroup(db, "payments"),
    where("eventId", "==", eventId),
    orderBy("fecha", "asc"),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as PaymentDoc) })));
  });
}

export function palcoRef(eventId: string, localityId: string, palcoId: string) {
  return doc(db, "events", eventId, "localities", localityId, "palcos", palcoId);
}

export function boletaSaleRef(eventId: string, localityId: string, saleId: string) {
  return doc(db, "events", eventId, "localities", localityId, "boletaSales", saleId);
}
