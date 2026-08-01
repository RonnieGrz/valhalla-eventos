import { useEffect, useState } from "react";
import { listenEvents } from "../services/events";
import type { Evento } from "../types";

export function useEvents() {
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenEvents((data) => {
      setEvents(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { events, loading };
}
