import type { BoletaSale, EstadoVenta, Palco } from "../types";

/** Estado de una reserva ya creada (comprador asignado) — nunca "disponible". */
export function computeEstado(
  montoAbonado: number,
  montoTotal: number,
): Exclude<EstadoVenta, "disponible"> {
  if (montoTotal > 0 && montoAbonado >= montoTotal) return "vendido";
  return "separado";
}

export function saldoPendiente(montoTotal: number, montoAbonado: number): number {
  return Math.max(0, montoTotal - montoAbonado);
}

export function porcentajePagado(montoTotal: number, montoAbonado: number): number {
  if (montoTotal <= 0) return 0;
  return Math.min(100, Math.round((montoAbonado / montoTotal) * 100));
}

export function boletasVendidasOSeparadas(sales: BoletaSale[]): number {
  return sales.reduce((sum, s) => sum + s.cantidad, 0);
}

export function aforoRestante(aforo: number, sales: BoletaSale[]): number {
  return Math.max(0, aforo - boletasVendidasOSeparadas(sales));
}

/** Estado agregado de un palco vendible por boleta, según asientos vendidos/pagados. */
export function computeEstadoPalcoBoleta(
  boletasVendidas: number,
  capacidad: number,
  montoAbonado: number,
  precioBoleta: number,
): EstadoVenta {
  if (boletasVendidas === 0) return "disponible";
  const totalComprometido = boletasVendidas * precioBoleta;
  const completo = boletasVendidas === capacidad && montoAbonado >= totalComprometido;
  return completo ? "vendido" : "separado";
}

/** Monto comprometido de un palco: precio completo si se reservó entero, o asientos vendidos × precio por boleta. */
export function montoComprometidoPalco(palco: Palco): number {
  if (palco.vendiblePorBoleta && palco.boletasVendidas > 0) {
    return palco.boletasVendidas * palco.precioBoleta;
  }
  return palco.estado !== "disponible" ? palco.precio : 0;
}

export function contarPalcosPorEstado(palcos: Palco[]) {
  return {
    disponibles: palcos.filter((p) => p.estado === "disponible").length,
    separados: palcos.filter((p) => p.estado === "separado").length,
    vendidos: palcos.filter((p) => p.estado === "vendido").length,
    total: palcos.length,
  };
}

export function contarBoletasPorEstado(sales: BoletaSale[]) {
  const separadas = sales
    .filter((s) => s.estado === "separado")
    .reduce((sum, s) => sum + s.cantidad, 0);
  const vendidas = sales
    .filter((s) => s.estado === "vendido")
    .reduce((sum, s) => sum + s.cantidad, 0);
  return { separadas, vendidas };
}
