export type EstadoVenta = "disponible" | "separado" | "vendido";

export type MetodoPago = "efectivo" | "transferencia" | "tarjeta";

export interface Comprador {
  nombre: string;
  cedula: string;
  telefono: string;
}

export interface EventoDoc {
  nombre: string;
  lugar: string;
  fecha: string; // ISO date (yyyy-mm-dd)
  descripcion: string;
  estado: "activo" | "finalizado";
  createdAt: number;
}

export interface Evento extends EventoDoc {
  id: string;
}

export interface PalcosConfig {
  cantidad: number;
  capacidadPorPalco: number;
  precio: number;
}

export interface BoletasConfig {
  aforo: number;
  precioUnitario: number;
}

export interface LocalidadDoc {
  nombre: string;
  palcosConfig: PalcosConfig;
  boletasConfig: BoletasConfig;
  createdAt: number;
}

export interface Localidad extends LocalidadDoc {
  id: string;
}

export interface PalcoDoc {
  numero: number;
  capacidad: number;
  precio: number;
  estado: EstadoVenta;
  comprador: Comprador | null;
  montoAbonado: number;
  /** Si es true, además de reservarse completo puede venderse asiento por asiento. */
  vendiblePorBoleta: boolean;
  /** Precio por asiento individual cuando vendiblePorBoleta es true (0 si no aplica). */
  precioBoleta: number;
  /** Asientos vendidos por boleta suelta dentro de este palco (0 si no aplica). */
  boletasVendidas: number;
  /** Sillas adicionales vendidas (pagadas) para este palco reservado completo, por fuera de su capacidad base (0 si no aplica). */
  sillasAdicionalesVendidas: number;
  /** Sillas adicionales de cortesía (sin costo) para este palco reservado completo (0 si no aplica). */
  sillasAdicionalesCortesia: number;
  /** Precio por silla adicional vendida (COP). 0 si no se han vendido sillas adicionales. */
  precioSillaAdicional: number;
  createdAt: number;
  updatedAt: number;
}

export interface Palco extends PalcoDoc {
  id: string;
  localidadId: string;
}

/** Venta de uno o más asientos sueltos dentro de un palco vendiblePorBoleta. */
export interface PalcoBoletaSaleDoc {
  comprador: Comprador;
  cantidad: number;
  precioUnitario: number;
  montoTotal: number;
  estado: EstadoVenta;
  montoAbonado: number;
  createdAt: number;
  updatedAt: number;
}

export interface PalcoBoletaSale extends PalcoBoletaSaleDoc {
  id: string;
  palcoId: string;
}

export interface BoletaSaleDoc {
  comprador: Comprador;
  cantidad: number;
  precioUnitario: number;
  montoTotal: number;
  estado: EstadoVenta;
  montoAbonado: number;
  createdAt: number;
  updatedAt: number;
}

export interface BoletaSale extends BoletaSaleDoc {
  id: string;
  localidadId: string;
}

export interface PaymentDoc {
  monto: number;
  fecha: string; // ISO date (yyyy-mm-dd)
  metodo: MetodoPago;
  nota: string;
  createdAt: number;
  // Denormalizado para poder hacer collectionGroup queries por evento (dashboard).
  eventId: string;
  localidadId: string;
}

export interface Payment extends PaymentDoc {
  id: string;
}
