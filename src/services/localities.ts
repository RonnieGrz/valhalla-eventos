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
}

/**
 * Mayor número de palco ya usado en todo el evento (entre todas sus localidades),
 * para que la numeración sea continua y no se repita entre localidades distintas.
 */
async function getEventMaxPalcoNumero(eventId: string): Promise<number> {
  const localitiesSnap = await getDocs(localitiesCol(eventId));
  const maxesPorLocalidad = await Promise.all(
    localitiesSnap.docs.map(async (localityDoc) => {
      const palcosSnap = await getDocs(
        collection(db, "events", eventId, "localities", localityDoc.id, "palcos"),
      );
      return palcosSnap.docs.reduce((max, d) => Math.max(max, (d.data() as PalcoDoc).numero), 0);
    }),
  );
  return maxesPorLocalidad.reduce((max, m) => Math.max(max, m), 0);
}

/** Crea la localidad y, si tiene palcos configurados, genera los N docs de palcos numerados.
 *  Por defecto continúa a partir del último palco del evento (entre todas las localidades);
 *  si se pasa `numeroInicial`, la numeración empieza ahí en su lugar (numeración manual, para
 *  venues donde los palcos no siguen una secuencia continua entre localidades). Los palcos
 *  nacen no vendibles por boleta suelta: esa opción se decide individualmente desde cada palco. */
export async function createLocality(
  eventId: string,
  data: Omit<LocalidadDoc, "createdAt">,
  numeroInicial?: number,
) {
  const localityRef = await addDoc(localitiesCol(eventId), {
    ...data,
    createdAt: Date.now(),
  } satisfies LocalidadDoc);

  if (data.palcosConfig.cantidad > 0) {
    const desde = numeroInicial ?? (await getEventMaxPalcoNumero(eventId)) + 1;
    await batchCreatePalcos(eventId, localityRef.id, desde, desde + data.palcosConfig.cantidad - 1, {
      capacidad: data.palcosConfig.capacidadPorPalco,
      precio: data.palcosConfig.precio,
    });
  }

  return localityRef;
}

/** Agrega N palcos nuevos a una localidad existente. Por defecto continúa a partir del último
 *  palco del evento (entre todas las localidades); si se pasa `numeroInicial`, empieza ahí. */
export async function addPalcosToLocality(
  eventId: string,
  localityId: string,
  cantidadNueva: number,
  capacidad: number,
  precio: number,
  numeroInicial?: number,
) {
  const desde = numeroInicial ?? (await getEventMaxPalcoNumero(eventId)) + 1;
  await batchCreatePalcos(eventId, localityId, desde, desde + cantidadNueva - 1, {
    capacidad,
    precio,
  });

  const existingCantidad = (
    await getDocs(collection(db, "events", eventId, "localities", localityId, "palcos"))
  ).docs.length;

  await updateDoc(doc(db, "events", eventId, "localities", localityId), {
    "palcosConfig.cantidad": existingCantidad,
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
      vendiblePorBoleta: false,
      precioBoleta: 0,
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
