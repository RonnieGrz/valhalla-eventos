import { useEffect, useState } from "react";
import { listenBoletaSales } from "../services/boletaSales";
import { listenPalcos } from "../services/palcos";
import type { BoletaSale, Palco } from "../types";

/** Palcos y ventas de boletas sueltas en tiempo real para una localidad. */
export function useLocalityDetail(eventId: string | undefined, localityId: string | undefined) {
  const [palcos, setPalcos] = useState<Palco[]>([]);
  const [boletaSales, setBoletaSales] = useState<BoletaSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !localityId) return;
    setLoading(true);
    let palcosLoaded = false;
    let salesLoaded = false;
    const checkLoaded = () => {
      if (palcosLoaded && salesLoaded) setLoading(false);
    };

    const unsubPalcos = listenPalcos(eventId, localityId, (data) => {
      setPalcos(data);
      palcosLoaded = true;
      checkLoaded();
    });
    const unsubSales = listenBoletaSales(eventId, localityId, (data) => {
      setBoletaSales(data);
      salesLoaded = true;
      checkLoaded();
    });

    return () => {
      unsubPalcos();
      unsubSales();
    };
  }, [eventId, localityId]);

  return { palcos, boletaSales, loading };
}
