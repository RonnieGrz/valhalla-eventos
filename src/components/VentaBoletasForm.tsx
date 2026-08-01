import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formatCOP, todayISO } from "../lib/format";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";

function buildSchema(aforoRestante: number, precioUnitario: number) {
  return z
    .object({
      nombre: z.string().min(1, "Requerido"),
      cedula: z.string().min(1, "Requerido"),
      telefono: z.string().min(1, "Requerido"),
      cantidad: z.coerce
        .number()
        .int()
        .min(1, "Debe ser al menos 1")
        .max(aforoRestante, `Solo quedan ${aforoRestante} boletas disponibles`),
      monto: z.coerce.number().min(0, "No puede ser negativo"),
      fecha: z.string().min(1, "Requerido"),
      metodo: z.enum(["efectivo", "transferencia", "tarjeta"]),
      nota: z.string().optional().default(""),
    })
    .refine((v) => v.monto <= v.cantidad * precioUnitario, {
      message: "El abono no puede superar el valor total de las boletas",
      path: ["monto"],
    });
}

type VentaBoletasFormInput = z.input<ReturnType<typeof buildSchema>>;
export type VentaBoletasFormValues = z.output<ReturnType<typeof buildSchema>>;

interface VentaBoletasFormProps {
  precioUnitario: number;
  aforoRestante: number;
  onCancel: () => void;
  onSubmit: (values: VentaBoletasFormValues) => Promise<void>;
}

export function VentaBoletasForm({
  precioUnitario,
  aforoRestante,
  onCancel,
  onSubmit,
}: VentaBoletasFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VentaBoletasFormInput, unknown, VentaBoletasFormValues>({
    resolver: zodResolver(buildSchema(aforoRestante, precioUnitario)),
    defaultValues: { fecha: todayISO(), metodo: "efectivo", monto: 0, cantidad: 1 },
  });

  const cantidad = Number(watch("cantidad")) || 0;
  const montoTotal = cantidad * precioUnitario;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormField label="Nombre del comprador" error={errors.nombre?.message}>
        <input className={inputClass} {...register("nombre")} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Cédula" error={errors.cedula?.message}>
          <input className={inputClass} {...register("cedula")} />
        </FormField>
        <FormField label="Teléfono" error={errors.telefono?.message}>
          <input className={inputClass} {...register("telefono")} />
        </FormField>
      </div>
      <FormField label={`Cantidad de boletas (disponibles: ${aforoRestante})`} error={errors.cantidad?.message}>
        <input type="number" min={1} className={inputClass} {...register("cantidad")} />
      </FormField>
      <p className="text-sm text-text-muted">
        Valor total: <span className="font-medium text-text-primary">{formatCOP(montoTotal)}</span>
      </p>
      <FormField label="Abono inicial" error={errors.monto?.message}>
        <input type="number" min={0} className={inputClass} {...register("monto")} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha del abono" error={errors.fecha?.message}>
          <input type="date" className={inputClass} {...register("fecha")} />
        </FormField>
        <FormField label="Método de pago" error={errors.metodo?.message}>
          <select className={inputClass} {...register("metodo")}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
        </FormField>
      </div>
      <FormField label="Nota (opcional)" error={errors.nota?.message}>
        <input className={inputClass} {...register("nota")} />
      </FormField>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className={buttonSecondaryClass}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={buttonPrimaryClass}>
          Registrar venta
        </button>
      </div>
    </form>
  );
}
