import { collectionGroup, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Parche de una sola vez: completa eventId/localidadId en pagos antiguos que
 * fueron creados antes de que PaymentDoc denormalizara esos campos, y que por
 * eso quedan invisibles para las consultas collectionGroup del dashboard.
 */
export async function backfillPaymentEventIds(): Promise<{ total: number; fixed: number }> {
  const snap = await getDocs(collectionGroup(db, "payments"));
  let fixed = 0;

  for (const d of snap.docs) {
    const data = d.data() as { eventId?: string; localidadId?: string };
    if (data.eventId && data.localidadId) continue;

    const parts = d.ref.path.split("/");
    const eventIdx = parts.indexOf("events");
    const localityIdx = parts.indexOf("localities");
    if (eventIdx === -1 || localityIdx === -1) continue;

    await updateDoc(d.ref, {
      eventId: parts[eventIdx + 1],
      localidadId: parts[localityIdx + 1],
    });
    fixed++;
  }

  return { total: snap.docs.length, fixed };
}
