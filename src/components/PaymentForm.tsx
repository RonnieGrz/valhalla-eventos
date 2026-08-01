import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { todayISO } from "../lib/format";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";

function buildSchema(saldoPendiente: number) {
  return z.object({
    monto: z.coerce
      .number()
      .min(1, "Debe ser mayor a 0")
      .max(saldoPendiente, `No puede superar el saldo pendiente (${saldoPendiente})`),
    fecha: z.string().min(1, "Requerido"),
    metodo: z.enum(["efectivo", "transferencia", "tarjeta"]),
    nota: z.string().optional().default(""),
  });
}

type PaymentFormInput = z.input<ReturnType<typeof buildSchema>>;
export type PaymentFormValues = z.output<ReturnType<typeof buildSchema>>;

interface PaymentFormProps {
  saldoPendiente: number;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (values: PaymentFormValues) => Promise<void>;
}

export function PaymentForm({ saldoPendiente, submitLabel, onCancel, onSubmit }: PaymentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormInput, unknown, PaymentFormValues>({
    resolver: zodResolver(buildSchema(saldoPendiente)),
    defaultValues: { fecha: todayISO(), metodo: "efectivo", monto: 0 },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormField label={`Monto (saldo pendiente: ${saldoPendiente})`} error={errors.monto?.message}>
        <input type="number" min={0} className={inputClass} {...register("monto")} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
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
