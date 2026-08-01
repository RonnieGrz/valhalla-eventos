import { useEffect, useState } from "react";
import { listenEventPayments } from "../services/payments";
import type { Payment } from "../types";

export function useEventPayments(eventId: string | undefined) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    const unsub = listenEventPayments(eventId, (data) => {
      setPayments(data);
      setLoading(false);
    });
    return unsub;
  }, [eventId]);

  return { payments, loading };
}
