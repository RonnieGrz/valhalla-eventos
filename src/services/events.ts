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
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { Evento, EventoDoc } from "../types";
import { deleteLocalityChildren } from "./localities";

const eventsCol = collection(db, "events");

export function listenEvents(cb: (events: Evento[]) => void) {
  const q = query(eventsCol, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as EventoDoc) })));
  });
}

export async function createEvent(data: Omit<EventoDoc, "createdAt" | "estado">) {
  return addDoc(eventsCol, {
    ...data,
    estado: "activo",
    createdAt: Date.now(),
  } satisfies EventoDoc);
}

export async function updateEvent(eventId: string, data: Partial<EventoDoc>) {
  await updateDoc(doc(db, "events", eventId), data);
}

/**
 * Firestore no borra subcolecciones automáticamente: se borra el árbol completo
 * (localidades -> palcos/boletaSales -> payments) antes que el evento.
 */
export async function deleteEvent(eventId: string) {
  const localitiesSnap = await getDocs(collection(db, "events", eventId, "localities"));

  for (const localityDoc of localitiesSnap.docs) {
    await deleteLocalityChildren(eventId, localityDoc.id);
    await deleteDoc(localityDoc.ref);
  }

  await deleteDoc(doc(db, "events", eventId));
}
