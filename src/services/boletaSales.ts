import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { computeEstado } from "../lib/estado";
import type { BoletaSale, BoletaSaleDoc, Comprador, Payment, PaymentDoc } from "../types";
import { boletaSaleRef, editarAbono, paymentRef, registrarAbono, type NuevoAbono } from "./payments";

function salesCol(eventId: string, localityId: string) {
  return collection(db, "events", eventId, "localities", localityId, "boletaSales");
}

export function listenBoletaSales(
  eventId: string,
  localityId: string,
  cb: (sales: BoletaSale[]) => void,
) {
  const q = query(salesCol(eventId, localityId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => ({
        id: d.id,
        localidadId: localityId,
        ...(d.data() as BoletaSaleDoc),
      })),
    );
  });
}

export function listenBoletaSalePayments(
  eventId: string,
  localityId: string,
  saleId: string,
  cb: (payments: Payment[]) => void,
) {
  const col = collection(
    db,
    "events",
    eventId,
    "localities",
    localityId,
    "boletaSales",
    saleId,
    "payments",
  );
  const q = query(col, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as PaymentDoc) })));
  });
}

/** Crea una venta de boletas sueltas, validando que no exceda el aforo restante de la localidad. */
export async function crearVentaBoletas(
  eventId: string,
  localityId: string,
  comprador: Comprador,
  cantidad: number,
  precioUnitario: number,
  aforoTotal: number,
  abonoInicial: NuevoAbono,
) {
  const existing = await getDocs(salesCol(eventId, localityId));
  const yaAsignadas = existing.docs.reduce(
    (sum, d) => sum + (d.data() as BoletaSaleDoc).cantidad,
    0,
  );
  if (yaAsignadas + cantidad > aforoTotal) {
    throw new Error(
      `Solo quedan ${Math.max(0, aforoTotal - yaAsignadas)} boletas disponibles en esta localidad`,
    );
  }

  const montoTotal = cantidad * precioUnitario;
  const estado = computeEstado(abonoInicial.monto, montoTotal);
  const saleRef = doc(salesCol(eventId, localityId));
  const now = Date.now();

  await runTransaction(db, async (tx) => {
    tx.set(saleRef, {
      comprador,
      cantidad,
      precioUnitario,
      montoTotal,
      estado,
      montoAbonado: abonoInicial.monto,
      createdAt: now,
      updatedAt: now,
    } satisfies BoletaSaleDoc);

    if (abonoInicial.monto > 0) {
      const paymentRef = doc(collection(saleRef, "payments"));
      tx.set(paymentRef, {
        monto: abonoInicial.monto,
        fecha: abonoInicial.fecha,
        metodo: abonoInicial.metodo,
        nota: abonoInicial.nota,
        createdAt: now,
        eventId,
        localidadId: localityId,
      } satisfies PaymentDoc);
    }
  });

  return saleRef;
}

export async function agregarAbonoVenta(
  eventId: string,
  localityId: string,
  saleId: string,
  abono: NuevoAbono,
  montoTotal: number,
) {
  await registrarAbono(
    boletaSaleRef(eventId, localityId, saleId),
    eventId,
    localityId,
    abono,
    montoTotal,
  );
}

/** Edita un abono ya registrado sobre una venta de boletas sueltas de una localidad. */
export async function editarAbonoVenta(
  eventId: string,
  localityId: string,
  saleId: string,
  paymentId: string,
  cambios: NuevoAbono,
  montoTotal: number,
) {
  const ref = boletaSaleRef(eventId, localityId, saleId);
  await editarAbono(ref, paymentRef(ref, paymentId), cambios, montoTotal);
}
