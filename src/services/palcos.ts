import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { computeEstado, computeEstadoPalcoBoleta } from "../lib/estado";
import type {
  Comprador,
  Palco,
  PalcoBoletaSale,
  PalcoBoletaSaleDoc,
  PalcoDoc,
  Payment,
  PaymentDoc,
} from "../types";
import { editarAbono, palcoRef, paymentRef, registrarAbono, type NuevoAbono } from "./payments";

function palcoBoletaSalesCol(eventId: string, localityId: string, palcoId: string) {
  return collection(
    db,
    "events",
    eventId,
    "localities",
    localityId,
    "palcos",
    palcoId,
    "boletaSales",
  );
}

export function listenPalcos(
  eventId: string,
  localityId: string,
  cb: (palcos: Palco[]) => void,
) {
  const col = collection(db, "events", eventId, "localities", localityId, "palcos");
  const q = query(col, orderBy("numero", "asc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data() as PalcoDoc;
        return {
          id: d.id,
          localidadId: localityId,
          ...data,
          // Palcos creados antes de habilitar esta función no tienen estos campos.
          vendiblePorBoleta: data.vendiblePorBoleta ?? false,
          precioBoleta: data.precioBoleta ?? 0,
          boletasVendidas: data.boletasVendidas ?? 0,
        };
      }),
    );
  });
}

export function listenPalcoPayments(
  eventId: string,
  localityId: string,
  palcoId: string,
  cb: (payments: Payment[]) => void,
) {
  const col = collection(
    db,
    "events",
    eventId,
    "localities",
    localityId,
    "palcos",
    palcoId,
    "payments",
  );
  const q = query(col, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as PaymentDoc) })));
  });
}

/** Reserva un palco disponible: asigna comprador y, si hay abono inicial, lo registra. */
export async function reservarPalco(
  eventId: string,
  localityId: string,
  palcoId: string,
  comprador: Comprador,
  abonoInicial: NuevoAbono,
  precio: number,
) {
  const ref = palcoRef(eventId, localityId, palcoId);
  const estadoInicial = computeEstado(abonoInicial.monto, precio);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("El palco ya no existe");
    const data = snap.data() as PalcoDoc;
    if (data.estado !== "disponible") {
      throw new Error("El palco ya no está disponible");
    }
    if (data.boletasVendidas > 0) {
      throw new Error("Este palco ya tiene boletas sueltas vendidas, no se puede reservar completo");
    }

    if (abonoInicial.monto > 0) {
      const paymentRef = doc(collection(ref, "payments"));
      tx.set(paymentRef, {
        monto: abonoInicial.monto,
        fecha: abonoInicial.fecha,
        metodo: abonoInicial.metodo,
        nota: abonoInicial.nota,
        createdAt: Date.now(),
        eventId,
        localidadId: localityId,
      } satisfies PaymentDoc);
    }

    tx.update(ref, {
      comprador,
      montoAbonado: abonoInicial.monto,
      estado: estadoInicial,
      updatedAt: Date.now(),
    });
  });
}

export async function agregarAbonoPalco(
  eventId: string,
  localityId: string,
  palcoId: string,
  abono: NuevoAbono,
  precio: number,
) {
  await registrarAbono(palcoRef(eventId, localityId, palcoId), eventId, localityId, abono, precio);
}

/** Edita un abono ya registrado sobre un palco reservado completo. */
export async function editarAbonoPalco(
  eventId: string,
  localityId: string,
  palcoId: string,
  paymentId: string,
  cambios: NuevoAbono,
  precio: number,
) {
  const ref = palcoRef(eventId, localityId, palcoId);
  await editarAbono(ref, paymentRef(ref, paymentId), cambios, precio);
}

/**
 * Habilita o deshabilita la venta por boleta suelta (asiento por asiento) de un palco puntual.
 * Solo se puede cambiar mientras el palco sigue disponible (nada vendido ni reservado todavía).
 */
export async function actualizarVendiblePorBoleta(
  eventId: string,
  localityId: string,
  palcoId: string,
  vendiblePorBoleta: boolean,
  precioBoleta: number,
) {
  const ref = palcoRef(eventId, localityId, palcoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("El palco ya no existe");
    const data = snap.data() as PalcoDoc;
    if (data.estado !== "disponible") {
      throw new Error("Solo se puede cambiar esta opción mientras el palco está disponible");
    }
    tx.update(ref, {
      vendiblePorBoleta,
      precioBoleta: vendiblePorBoleta ? precioBoleta : 0,
      updatedAt: Date.now(),
    });
  });
}

/**
 * Cancela la reserva completa de un palco y lo deja disponible de nuevo.
 * Si tenía abonos registrados, se borran junto con la reserva (el llamador debe
 * confirmar esto con el usuario antes, ya que es irreversible). No se puede
 * cancelar si el palco tiene boletas sueltas vendidas: esas ventas son
 * independientes y deben resolverse por su cuenta primero.
 */
export async function liberarPalco(eventId: string, localityId: string, palcoId: string) {
  const ref = palcoRef(eventId, localityId, palcoId);
  const paymentsSnap = await getDocs(collection(ref, "payments"));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("El palco ya no existe");
    const data = snap.data() as PalcoDoc;
    if (data.boletasVendidas > 0) {
      throw new Error("No se puede liberar un palco con boletas sueltas vendidas");
    }
    for (const paymentDoc of paymentsSnap.docs) {
      tx.delete(paymentDoc.ref);
    }
    tx.update(ref, {
      comprador: null,
      montoAbonado: 0,
      estado: "disponible",
      updatedAt: Date.now(),
    });
  });
}

/** Cambia los datos del comprador de un palco ya reservado (corrección, no una nueva reserva). */
export async function editarCompradorPalco(
  eventId: string,
  localityId: string,
  palcoId: string,
  comprador: Comprador,
) {
  await updateDoc(palcoRef(eventId, localityId, palcoId), {
    comprador,
    updatedAt: Date.now(),
  });
}

export function listenPalcoBoletaSales(
  eventId: string,
  localityId: string,
  palcoId: string,
  cb: (sales: PalcoBoletaSale[]) => void,
) {
  const q = query(palcoBoletaSalesCol(eventId, localityId, palcoId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, palcoId, ...(d.data() as PalcoBoletaSaleDoc) })));
  });
}

export function listenPalcoBoletaSalePayments(
  eventId: string,
  localityId: string,
  palcoId: string,
  saleId: string,
  cb: (payments: Payment[]) => void,
) {
  const col = collection(
    db,
    "events",
    eventId,
    "localities",
    localityId,
    "palcos",
    palcoId,
    "boletaSales",
    saleId,
    "payments",
  );
  const q = query(col, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as PaymentDoc) })));
  });
}

/**
 * Vende asientos sueltos dentro de un palco habilitado para eso: valida capacidad
 * restante y, en la misma transacción, actualiza el agregado (estado/montoAbonado)
 * del palco para que la grilla y el dashboard reflejen el avance sin lógica extra.
 */
export async function venderBoletaPalco(
  eventId: string,
  localityId: string,
  palcoId: string,
  comprador: Comprador,
  cantidad: number,
  abonoInicial: NuevoAbono,
) {
  const ref = palcoRef(eventId, localityId, palcoId);
  const saleRef = doc(palcoBoletaSalesCol(eventId, localityId, palcoId));
  const now = Date.now();

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("El palco ya no existe");
    const palco = snap.data() as PalcoDoc;

    if (!palco.vendiblePorBoleta) {
      throw new Error("Este palco no está habilitado para venta por boleta suelta");
    }
    if (palco.comprador) {
      throw new Error("Este palco ya fue reservado completo");
    }

    const restante = palco.capacidad - palco.boletasVendidas;
    if (cantidad > restante) {
      throw new Error(`Solo quedan ${restante} boletas disponibles en este palco`);
    }

    const montoTotal = cantidad * palco.precioBoleta;
    const estadoVenta = computeEstado(abonoInicial.monto, montoTotal);

    tx.set(saleRef, {
      comprador,
      cantidad,
      precioUnitario: palco.precioBoleta,
      montoTotal,
      estado: estadoVenta,
      montoAbonado: abonoInicial.monto,
      createdAt: now,
      updatedAt: now,
    } satisfies PalcoBoletaSaleDoc);

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

    const nuevoBoletasVendidas = palco.boletasVendidas + cantidad;
    const nuevoMontoAbonado = palco.montoAbonado + abonoInicial.monto;

    tx.update(ref, {
      boletasVendidas: nuevoBoletasVendidas,
      montoAbonado: nuevoMontoAbonado,
      estado: computeEstadoPalcoBoleta(
        nuevoBoletasVendidas,
        palco.capacidad,
        nuevoMontoAbonado,
        palco.precioBoleta,
      ),
      updatedAt: now,
    });
  });

  return saleRef;
}

/** Registra un abono sobre una venta de boletas sueltas de un palco y actualiza el agregado del palco. */
export async function agregarAbonoBoletaPalco(
  eventId: string,
  localityId: string,
  palcoId: string,
  saleId: string,
  abono: NuevoAbono,
  montoTotalVenta: number,
) {
  const palcoDocRef = palcoRef(eventId, localityId, palcoId);
  const saleRef = doc(palcoBoletaSalesCol(eventId, localityId, palcoId), saleId);

  await runTransaction(db, async (tx) => {
    const palcoSnap = await tx.get(palcoDocRef);
    const saleSnap = await tx.get(saleRef);
    if (!palcoSnap.exists()) throw new Error("El palco ya no existe");
    if (!saleSnap.exists()) throw new Error("El registro ya no existe");

    const palco = palcoSnap.data() as PalcoDoc;
    const saleMontoAbonadoActual = (saleSnap.data().montoAbonado as number) ?? 0;
    const nuevoSaleMontoAbonado = saleMontoAbonadoActual + abono.monto;

    const paymentRef = doc(collection(saleRef, "payments"));
    tx.set(paymentRef, {
      monto: abono.monto,
      fecha: abono.fecha,
      metodo: abono.metodo,
      nota: abono.nota,
      createdAt: Date.now(),
      eventId,
      localidadId: localityId,
    } satisfies PaymentDoc);

    tx.update(saleRef, {
      montoAbonado: nuevoSaleMontoAbonado,
      estado: computeEstado(nuevoSaleMontoAbonado, montoTotalVenta),
      updatedAt: Date.now(),
    });

    const nuevoPalcoMontoAbonado = palco.montoAbonado + abono.monto;
    tx.update(palcoDocRef, {
      montoAbonado: nuevoPalcoMontoAbonado,
      estado: computeEstadoPalcoBoleta(
        palco.boletasVendidas,
        palco.capacidad,
        nuevoPalcoMontoAbonado,
        palco.precioBoleta,
      ),
      updatedAt: Date.now(),
    });
  });
}

/**
 * Edita un abono ya registrado sobre una venta de boletas sueltas dentro de un palco:
 * corrige el agregado tanto de la venta como del palco por la diferencia de monto.
 */
export async function editarAbonoBoletaPalco(
  eventId: string,
  localityId: string,
  palcoId: string,
  saleId: string,
  paymentId: string,
  cambios: NuevoAbono,
  montoTotalVenta: number,
) {
  const palcoDocRef = palcoRef(eventId, localityId, palcoId);
  const saleRef = doc(palcoBoletaSalesCol(eventId, localityId, palcoId), saleId);
  const paymentDocRef = paymentRef(saleRef, paymentId);

  await runTransaction(db, async (tx) => {
    const palcoSnap = await tx.get(palcoDocRef);
    const saleSnap = await tx.get(saleRef);
    const paymentSnap = await tx.get(paymentDocRef);
    if (!palcoSnap.exists()) throw new Error("El palco ya no existe");
    if (!saleSnap.exists()) throw new Error("El registro ya no existe");
    if (!paymentSnap.exists()) throw new Error("El abono ya no existe");

    const palco = palcoSnap.data() as PalcoDoc;
    const montoAnterior = (paymentSnap.data().monto as number) ?? 0;
    const saleMontoAbonadoActual = (saleSnap.data().montoAbonado as number) ?? 0;
    const delta = cambios.monto - montoAnterior;
    const nuevoSaleMontoAbonado = saleMontoAbonadoActual + delta;

    tx.update(paymentDocRef, {
      monto: cambios.monto,
      fecha: cambios.fecha,
      metodo: cambios.metodo,
      nota: cambios.nota,
    });

    tx.update(saleRef, {
      montoAbonado: nuevoSaleMontoAbonado,
      estado: computeEstado(nuevoSaleMontoAbonado, montoTotalVenta),
      updatedAt: Date.now(),
    });

    const nuevoPalcoMontoAbonado = palco.montoAbonado + delta;
    tx.update(palcoDocRef, {
      montoAbonado: nuevoPalcoMontoAbonado,
      estado: computeEstadoPalcoBoleta(
        palco.boletasVendidas,
        palco.capacidad,
        nuevoPalcoMontoAbonado,
        palco.precioBoleta,
      ),
      updatedAt: Date.now(),
    });
  });
}
