import { useEffect, useRef, useState } from "react";
import { listenBoletaSales } from "../services/boletaSales";
import { listenLocalities } from "../services/localities";
import { listenPalcos } from "../services/palcos";
import type { BoletaSale, Localidad, Palco } from "../types";

/**
 * Agrega en tiempo real las localidades de un evento junto con todos sus
 * palcos y ventas de boletas, para alimentar el dashboard.
 */
export function useEventData(eventId: string | undefined) {
  const [localities, setLocalities] = useState<Localidad[]>([]);
  const [palcosByLocality, setPalcosByLocality] = useState<Record<string, Palco[]>>({});
  const [salesByLocality, setSalesByLocality] = useState<Record<string, BoletaSale[]>>({});
  const [loading, setLoading] = useState(true);
  const unsubsRef = useRef<Record<string, () => void>>({});

  useEffect(() => {
    if (!eventId) return;

    const unsubLocalities = listenLocalities(eventId, (data) => {
      setLocalities(data);
      setLoading(false);

      const currentIds = new Set(data.map((l) => l.id));

      for (const id of Object.keys(unsubsRef.current)) {
        if (!currentIds.has(id)) {
          unsubsRef.current[id]();
          delete unsubsRef.current[id];
          setPalcosByLocality((prev) => {
            const rest = { ...prev };
            delete rest[id];
            return rest;
          });
          setSalesByLocality((prev) => {
            const rest = { ...prev };
            delete rest[id];
            return rest;
          });
        }
      }

      for (const locality of data) {
        if (unsubsRef.current[locality.id]) continue;

        const unsubPalcos = listenPalcos(eventId, locality.id, (palcos) => {
          setPalcosByLocality((prev) => ({ ...prev, [locality.id]: palcos }));
        });
        const unsubSales = listenBoletaSales(eventId, locality.id, (sales) => {
          setSalesByLocality((prev) => ({ ...prev, [locality.id]: sales }));
        });

        unsubsRef.current[locality.id] = () => {
          unsubPalcos();
          unsubSales();
        };
      }
    });

    return () => {
      unsubLocalities();
      Object.values(unsubsRef.current).forEach((unsub) => unsub());
      unsubsRef.current = {};
    };
  }, [eventId]);

  const allPalcos = Object.values(palcosByLocality).flat();
  const allSales = Object.values(salesByLocality).flat();

  return { localities, palcosByLocality, salesByLocality, allPalcos, allSales, loading };
}
