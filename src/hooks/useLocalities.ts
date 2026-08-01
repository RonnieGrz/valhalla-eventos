import { useEffect, useState } from "react";
import { listenLocalities } from "../services/localities";
import type { Localidad } from "../types";

export function useLocalities(eventId: string | undefined) {
  const [localities, setLocalities] = useState<Localidad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    const unsub = listenLocalities(eventId, (data) => {
      setLocalities(data);
      setLoading(false);
    });
    return unsub;
  }, [eventId]);

  return { localities, loading };
}
