import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { Gasto, GastoDoc } from "../types";

type GastoInput = Pick<GastoDoc, "fecha" | "descripcion" | "monto">;

function expensesCol(eventId: string) {
  return collection(db, "events", eventId, "expenses");
}

export function listenExpenses(eventId: string, cb: (gastos: Gasto[]) => void) {
  // Un solo orderBy evita requerir un índice compuesto; el desempate por createdAt se hace en cliente.
  const q = query(expensesCol(eventId), orderBy("fecha", "desc"));
  return onSnapshot(q, (snap) => {
    const gastos = snap.docs.map((d) => ({ id: d.id, ...(d.data() as GastoDoc) }));
    gastos.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.createdAt - a.createdAt);
    cb(gastos);
  });
}

export async function createExpense(eventId: string, data: GastoInput) {
  await addDoc(expensesCol(eventId), { ...data, createdAt: Date.now() } satisfies GastoDoc);
}

export async function updateExpense(eventId: string, expenseId: string, data: GastoInput) {
  await updateDoc(doc(db, "events", eventId, "expenses", expenseId), data);
}

export async function deleteExpense(eventId: string, expenseId: string) {
  await deleteDoc(doc(db, "events", eventId, "expenses", expenseId));
}
