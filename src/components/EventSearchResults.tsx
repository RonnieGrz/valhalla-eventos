import { Link } from "react-router-dom";
import { compradorMatches, palcoMatchesQuery, ventaMatchesQuery } from "../lib/search";
import type { BoletaSale, Localidad, Palco, PalcoBoletaSale } from "../types";
import { EstadoBadge } from "./EstadoBadge";

interface EventSearchResultsProps {
  eventId: string;
  query: string;
  localities: Localidad[];
  palcosByLocality: Record<string, Palco[]>;
  salesByLocality: Record<string, BoletaSale[]>;
  seatSalesByPalco: Record<string, PalcoBoletaSale[]>;
  onSelectPalco: (localityId: string, palcoId: string) => void;
}

const rowClass =
  "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gridline bg-surface-1 px-4 py-3 text-sm transition duration-150 ease-out-strong hover:border-series-1";

/** Resultados de búsqueda a nivel de evento: palcos (por número o comprador) y ventas de boletas sueltas. */
export function EventSearchResults({
  eventId,
  query,
  localities,
  palcosByLocality,
  salesByLocality,
  seatSalesByPalco,
  onSelectPalco,
}: EventSearchResultsProps) {
  const palcoRows = localities.flatMap((loc) =>
    (palcosByLocality[loc.id] ?? []).flatMap((palco) => {
      const seatMatches = (seatSalesByPalco[palco.id] ?? []).filter((s) => compradorMatches(s.comprador, query));
      if (!palcoMatchesQuery(palco, query) && seatMatches.length === 0) return [];
      return [{ loc, palco, seatMatches }];
    }),
  );

  const ventaRows = localities.flatMap((loc) =>
    (salesByLocality[loc.id] ?? [])
      .filter((s) => ventaMatchesQuery(s, query))
      .map((sale) => ({ loc, sale })),
  );

  if (palcoRows.length === 0 && ventaRows.length === 0) {
    return <p className="text-sm text-text-muted">Nada coincide con "{query}".</p>;
  }

  return (
    <div className="space-y-6">
      {palcoRows.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-primary">Palcos ({palcoRows.length})</h2>
          <ul className="space-y-2">
            {palcoRows.map(({ loc, palco, seatMatches }) => {
              const nombres =
                palco.comprador !== null
                  ? [palco.comprador]
                  : seatMatches.map((s) => s.comprador);
              return (
                <li key={palco.id}>
                  <button
                    type="button"
                    onClick={() => onSelectPalco(loc.id, palco.id)}
                    className={`${rowClass} w-full text-left`}
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {loc.nombre} · Palco {palco.numero}
                        {palco.cortesia && <span className="ml-2 text-xs text-status-warning">Cortesía</span>}
                      </p>
                      {nombres.map((c, i) => (
                        <p key={i} className="text-text-secondary">
                          {c.nombre}
                          {c.cedula && ` · CC ${c.cedula}`}
                          {c.telefono && ` · ${c.telefono}`}
                        </p>
                      ))}
                    </div>
                    <EstadoBadge estado={palco.estado} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {ventaRows.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-primary">
            Boletas sueltas ({ventaRows.length})
          </h2>
          <ul className="space-y-2">
            {ventaRows.map(({ loc, sale }) => (
              <li key={sale.id}>
                <Link
                  to={`/eventos/${eventId}/localidades/${loc.id}?q=${encodeURIComponent(query)}`}
                  className={rowClass}
                >
                  <div>
                    <p className="font-medium text-text-primary">
                      {loc.nombre} · {sale.cantidad} boleta{sale.cantidad === 1 ? "" : "s"}
                    </p>
                    <p className="text-text-secondary">
                      {sale.comprador.nombre}
                      {sale.comprador.cedula && ` · CC ${sale.comprador.cedula}`}
                      {sale.comprador.telefono && ` · ${sale.comprador.telefono}`}
                    </p>
                  </div>
                  <EstadoBadge estado={sale.estado} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
