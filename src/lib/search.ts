import type { Comprador, Palco } from "../types";

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

/** Ignora puntos, guiones y espacios para que "12.345.678" coincida con "12345678". */
function normalizeDigits(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function compradorMatches(comprador: Comprador | null, query: string): boolean {
  if (!comprador) return false;
  if (normalizeText(comprador.nombre).includes(normalizeText(query))) return true;
  return normalizeDigits(comprador.cedula).includes(normalizeDigits(query));
}

/** Un palco coincide por su número o por el nombre/cédula de quien lo reservó. */
export function palcoMatchesQuery(palco: Palco, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  if (String(palco.numero).includes(q)) return true;
  return compradorMatches(palco.comprador, q);
}

/** Una venta de boletas sueltas coincide por el nombre/cédula de quien la hizo. */
export function ventaMatchesQuery(venta: { comprador: Comprador }, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  return compradorMatches(venta.comprador, q);
}
