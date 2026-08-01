import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { Localidad, LocalidadDoc, PalcoDoc } from "../types";

function localitiesCol(eventId: string) {
  return collection(db, "events", eventId, "localities");
}

export function listenLocalities(eventId: string, cb: (localities: Localidad[]) => void) {
  const q = query(localitiesCol(eventId), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as LocalidadDoc) })));
  });
}

interface PalcosBatchOpts {
  capacidad: number;
  precio: number;
  vendiblePorBoleta: boolean;
  precioBoleta: number;
}

/** Crea la localidad y, si tiene palcos configurados, genera los N docs de palcos numerados. */
export async function createLocality(
  eventId: string,
  data: Omit<LocalidadDoc, "createdAt">,
  palcosBoletaOpts?: { vendiblePorBoleta: boolean; precioBoleta: number },
) {
  const localityRef = await addDoc(localitiesCol(eventId), {
    ...data,
    createdAt: Date.now(),
  } satisfies LocalidadDoc);

  if (data.palcosConfig.cantidad > 0) {
    await batchCreatePalcos(eventId, localityRef.id, 1, data.palcosConfig.cantidad, {
      capacidad: data.palcosConfig.capacidadPorPalco,
      precio: data.palcosConfig.precio,
      vendiblePorBoleta: palcosBoletaOpts?.vendiblePorBoleta ?? false,
      precioBoleta: palcosBoletaOpts?.precioBoleta ?? 0,
    });
  }

  return localityRef;
}

/** Agrega N palcos nuevos numerados a continuación de los existentes. */
export async function addPalcosToLocality(
  eventId: string,
  localityId: string,
  cantidadNueva: number,
  capacidad: number,
  precio: number,
  vendiblePorBoleta: boolean,
  precioBoleta: number,
) {
  const existing = await getDocs(collection(db, "events", eventId, "localities", localityId, "palcos"));
  const maxNumero = existing.docs.reduce(
    (max, d) => Math.max(max, (d.data() as PalcoDoc).numero),
    0,
  );
  await batchCreatePalcos(eventId, localityId, maxNumero + 1, maxNumero + cantidadNueva, {
    capacidad,
    precio,
    vendiblePorBoleta,
    precioBoleta,
  });

  await updateDoc(doc(db, "events", eventId, "localities", localityId), {
    "palcosConfig.cantidad": maxNumero + cantidadNueva,
    "palcosConfig.capacidadPorPalco": capacidad,
    "palcosConfig.precio": precio,
  });
}

async function batchCreatePalcos(
  eventId: string,
  localityId: string,
  desde: number,
  hasta: number,
  opts: PalcosBatchOpts,
) {
  const palcosCol = collection(db, "events", eventId, "localities", localityId, "palcos");
  const batch = writeBatch(db);
  const now = Date.now();
  for (let numero = desde; numero <= hasta; numero++) {
    const palcoRef = doc(palcosCol);
    batch.set(palcoRef, {
      numero,
      capacidad: opts.capacidad,
      precio: opts.precio,
      estado: "disponible",
      comprador: null,
      montoAbonado: 0,
      vendiblePorBoleta: opts.vendiblePorBoleta,
      precioBoleta: opts.precioBoleta,
      boletasVendidas: 0,
      createdAt: now,
      updatedAt: now,
    } satisfies PalcoDoc);
  }
  await batch.commit();
}

export async function updateLocality(
  eventId: string,
  localityId: string,
  data: Partial<Pick<LocalidadDoc, "nombre" | "boletasConfig">>,
) {
  await updateDoc(doc(db, "events", eventId, "localities", localityId), data);
}

/** Borra palcos/boletaSales y sus payments, sin borrar el doc de la localidad. */
export async function deleteLocalityChildren(eventId: string, localityId: string) {
  const localityPath = ["events", eventId, "localities", localityId] as const;

  const palcosSnap = await getDocs(collection(db, ...localityPath, "palcos"));
  for (const palcoDoc of palcosSnap.docs) {
    const paymentsSnap = await getDocs(
      collection(db, ...localityPath, "palcos", palcoDoc.id, "payments"),
    );
    const batch = writeBatch(db);
    paymentsSnap.docs.forEach((p) => batch.delete(p.ref));
    batch.delete(palcoDoc.ref);
    await batch.commit();
  }

  const salesSnap = await getDocs(collection(db, ...localityPath, "boletaSales"));
  for (const saleDoc of salesSnap.docs) {
    const paymentsSnap = await getDocs(
      collection(db, ...localityPath, "boletaSales", saleDoc.id, "payments"),
    );
    const batch = writeBatch(db);
    paymentsSnap.docs.forEach((p) => batch.delete(p.ref));
    batch.delete(saleDoc.ref);
    await batch.commit();
  }
}

export async function deleteLocality(eventId: string, localityId: string) {
  await deleteLocalityChildren(eventId, localityId);
  await deleteDoc(doc(db, "events", eventId, "localities", localityId));
}
