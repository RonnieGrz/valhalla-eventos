import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { todayISO } from "../lib/format";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";

const schema = z.object({
  fecha: z.string().min(1, "Requerido"),
  descripcion: z.string().trim().min(1, "Describe el gasto"),
  monto: z.coerce.number().min(1, "Debe ser mayor a 0"),
});

type GastoFormInput = z.input<typeof schema>;
export type GastoFormValues = z.output<typeof schema>;

interface GastoFormProps {
  /** Presente en modo edición; sin esto el formulario es de registro rápido (se limpia al guardar). */
  initialValues?: GastoFormValues;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (values: GastoFormValues) => Promise<void>;
}

/**
 * Registro de un gasto: fecha (hoy por defecto), descripción y valor. En modo registro queda listo
 * para el siguiente gasto tras guardar (conserva la fecha y devuelve el foco a la descripción).
 */
export function GastoForm({ initialValues, submitLabel, onCancel, onSubmit }: GastoFormProps) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<GastoFormInput, unknown, GastoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? { fecha: todayISO(), descripcion: "", monto: undefined },
  });

  async function submit(values: GastoFormValues) {
    setError(null);
    try {
      await onSubmit(values);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el gasto");
      return;
    }
    if (!initialValues) {
      reset({ fecha: values.fecha, descripcion: "", monto: undefined });
      setFocus("descripcion");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr_11rem]">
        <FormField label="Fecha" error={errors.fecha?.message}>
          <input type="date" className={inputClass} {...register("fecha")} />
        </FormField>
        <FormField label="Descripción" error={errors.descripcion?.message}>
          <input
            className={inputClass}
            placeholder="Ej: Alquiler de sonido"
            autoComplete="off"
            {...register("descripcion")}
          />
        </FormField>
        <FormField label="Valor (COP)" error={errors.monto?.message}>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            className={inputClass}
            placeholder="0"
            {...register("monto")}
          />
        </FormField>
      </div>
      {error && <p className="text-sm text-status-critical">{error}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className={buttonSecondaryClass}>
            Cancelar
          </button>
        )}
        <button type="submit" disabled={isSubmitting} className={buttonPrimaryClass}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
