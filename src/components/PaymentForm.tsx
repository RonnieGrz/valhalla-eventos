import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formatCOP, todayISO } from "../lib/format";
import type { MetodoPago } from "../types";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";

function buildSchema(montoMaximo: number) {
  return z.object({
    monto: z.coerce
      .number()
      .min(1, "Debe ser mayor a 0")
      .max(montoMaximo, `No puede superar ${montoMaximo}`),
    fecha: z.string().min(1, "Requerido"),
    metodo: z.enum(["efectivo", "transferencia", "tarjeta"]),
    nota: z.string().optional().default(""),
  });
}

type PaymentFormInput = z.input<ReturnType<typeof buildSchema>>;
export type PaymentFormValues = z.output<ReturnType<typeof buildSchema>>;

interface PaymentFormInitialValues {
  monto: number;
  fecha: string;
  metodo: MetodoPago;
  nota: string;
}

interface PaymentFormProps {
  /** Saldo aún no cubierto por ningún abono (sin contar el que se está editando, si aplica). */
  saldoPendiente: number;
  submitLabel: string;
  /** Presente en modo edición: precarga el formulario con un abono existente. */
  initialValues?: PaymentFormInitialValues;
  onCancel: () => void;
  onSubmit: (values: PaymentFormValues) => Promise<void>;
}

export function PaymentForm({
  saldoPendiente,
  submitLabel,
  initialValues,
  onCancel,
  onSubmit,
}: PaymentFormProps) {
  // Al editar, este abono ya está contado en el saldo pendiente actual del padre,
  // así que el tope real es el saldo más lo que este abono ya aportaba.
  const montoMaximo = saldoPendiente + (initialValues?.monto ?? 0);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormInput, unknown, PaymentFormValues>({
    resolver: zodResolver(buildSchema(montoMaximo)),
    defaultValues: initialValues ?? { fecha: todayISO(), metodo: "efectivo", monto: 0 },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormField label={`Monto (máximo: ${montoMaximo})`} error={errors.monto?.message}>
        <input type="number" min={0} className={inputClass} {...register("monto")} />
      </FormField>
      {montoMaximo > 0 && (
        <button
          type="button"
          onClick={() => setValue("monto", montoMaximo, { shouldValidate: true })}
          className="text-sm font-medium text-series-1 hover:underline"
        >
          Pagar saldo completo ({formatCOP(montoMaximo)})
        </button>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Fecha" error={errors.fecha?.message}>
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
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
