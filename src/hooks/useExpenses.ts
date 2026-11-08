import { useEffect, useState } from "react";
import { listenExpenses } from "../services/expenses";
import type { Gasto } from "../types";

export function useExpenses(eventId: string | undefined) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    return listenExpenses(eventId, (data) => {
      setGastos(data);
      setLoading(false);
    });
  }, [eventId]);

  return { gastos, loading };
}
