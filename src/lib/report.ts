import ExcelJS from "exceljs";
import type { BoletaSale, EstadoVenta, Localidad, Palco } from "../types";
import { montoComprometidoPalco, saldoPendiente } from "./estado";

const ESTADO_LABEL: Record<EstadoVenta, string> = {
  disponible: "Disponible",
  separado: "Separado",
  vendido: "Vendido",
};

const CURRENCY_FORMAT = '"$"#,##0';
const HEADER_FILL = "FF49111C";
const HEADER_FONT_COLOR = "FFFFFFFF";

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_FONT_COLOR } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle" };
  });
  row.height = 20;
}

function applyCurrencyFormat(row: ExcelJS.Row, keys: string[]) {
  for (const key of keys) {
    row.getCell(key).numFmt = CURRENCY_FORMAT;
  }
}

interface ReporteEventoParams {
  eventoNombre: string;
  localities: Localidad[];
  palcosByLocality: Record<string, Palco[]>;
  salesByLocality: Record<string, BoletaSale[]>;
}

/** Construye el workbook del reporte (palcos + boletas sueltas). Puro y testeable fuera del navegador. */
export function buildReporteEventoWorkbook({
  eventoNombre,
  localities,
  palcosByLocality,
  salesByLocality,
}: ReporteEventoParams): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Valhalla Eventos";
  workbook.created = new Date();

  const localidadNombre = (id: string) => localities.find((l) => l.id === id)?.nombre ?? "";

  // --- Palcos: uno por fila, con su estado, comprador, deuda y disponibilidad. ---
  const palcosSheet = workbook.addWorksheet("Palcos");
  palcosSheet.columns = [
    { header: "Localidad", key: "localidad", width: 20 },
    { header: "Palco #", key: "numero", width: 10 },
    { header: "Estado", key: "estado", width: 14 },
    { header: "Comprador", key: "comprador", width: 24 },
    { header: "Cédula", key: "cedula", width: 16 },
    { header: "Teléfono", key: "telefono", width: 16 },
    { header: "Precio palco", key: "precio", width: 14 },
    { header: "Comprometido", key: "comprometido", width: 14 },
    { header: "Abonado", key: "abonado", width: 14 },
    { header: "Deuda", key: "deuda", width: 14 },
    { header: "Vendible por boleta", key: "vendiblePorBoleta", width: 16 },
    { header: "Asientos vendidos", key: "boletasVendidas", width: 14 },
    { header: "Capacidad", key: "capacidad", width: 12 },
  ];
  styleHeaderRow(palcosSheet.getRow(1));

  const allPalcos = localities
    .flatMap((l) => palcosByLocality[l.id] ?? [])
    .sort((a, b) => {
      const nombreA = localidadNombre(a.localidadId);
      const nombreB = localidadNombre(b.localidadId);
      return nombreA === nombreB ? a.numero - b.numero : nombreA.localeCompare(nombreB);
    });

  for (const palco of allPalcos) {
    const comprometido = montoComprometidoPalco(palco);
    const deuda = saldoPendiente(comprometido, palco.montoAbonado);
    const row = palcosSheet.addRow({
      localidad: localidadNombre(palco.localidadId),
      numero: palco.numero,
      estado: ESTADO_LABEL[palco.estado],
      comprador: palco.comprador?.nombre ?? "",
      cedula: palco.comprador?.cedula ?? "",
      telefono: palco.comprador?.telefono ?? "",
      precio: palco.precio,
      comprometido,
      abonado: palco.montoAbonado,
      deuda,
      vendiblePorBoleta: palco.vendiblePorBoleta ? "Sí" : "No",
      boletasVendidas: palco.vendiblePorBoleta ? palco.boletasVendidas : "",
      capacidad: palco.capacidad,
    });
    applyCurrencyFormat(row, ["precio", "comprometido", "abonado", "deuda"]);
  }
  palcosSheet.autoFilter = "A1:M1";
  palcosSheet.views = [{ state: "frozen", ySplit: 1 }];

  // --- Boletas sueltas: una fila por venta (comprador + cantidad de asientos). ---
  const boletasSheet = workbook.addWorksheet("Boletas sueltas");
  boletasSheet.columns = [
    { header: "Localidad", key: "localidad", width: 20 },
    { header: "Comprador", key: "comprador", width: 24 },
    { header: "Cédula", key: "cedula", width: 16 },
    { header: "Teléfono", key: "telefono", width: 16 },
    { header: "Cantidad", key: "cantidad", width: 10 },
    { header: "Precio unitario", key: "precioUnitario", width: 14 },
    { header: "Monto total", key: "montoTotal", width: 14 },
    { header: "Abonado", key: "abonado", width: 14 },
    { header: "Deuda", key: "deuda", width: 14 },
    { header: "Estado", key: "estado", width: 14 },
  ];
  styleHeaderRow(boletasSheet.getRow(1));

  const allSales = localities
    .flatMap((l) => salesByLocality[l.id] ?? [])
    .sort((a, b) => localidadNombre(a.localidadId).localeCompare(localidadNombre(b.localidadId)));

  for (const sale of allSales) {
    const deuda = saldoPendiente(sale.montoTotal, sale.montoAbonado);
    const row = boletasSheet.addRow({
      localidad: localidadNombre(sale.localidadId),
      comprador: sale.comprador.nombre,
      cedula: sale.comprador.cedula,
      telefono: sale.comprador.telefono,
      cantidad: sale.cantidad,
      precioUnitario: sale.precioUnitario,
      montoTotal: sale.montoTotal,
      abonado: sale.montoAbonado,
      deuda,
      estado: ESTADO_LABEL[sale.estado],
    });
    applyCurrencyFormat(row, ["precioUnitario", "montoTotal", "abonado", "deuda"]);
  }
  boletasSheet.autoFilter = "A1:J1";
  boletasSheet.views = [{ state: "frozen", ySplit: 1 }];

  workbook.title = `Reporte ${eventoNombre}`;
  return workbook;
}

const COMBINING_DIACRITICS = new RegExp("[̀-ͯ]", "g");

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

/** Genera el reporte y dispara su descarga como .xlsx en el navegador. */
export async function descargarReporteEvento(params: ReporteEventoParams): Promise<void> {
  const workbook = buildReporteEventoWorkbook(params);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-${slugify(params.eventoNombre)}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
