import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Comprador } from "../types";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  cedula: z.string().min(1, "Requerido"),
  telefono: z.string().min(1, "Requerido"),
});

export type CompradorFormValues = z.infer<typeof schema>;

interface CompradorFormProps {
  initialValues: Comprador;
  onCancel: () => void;
  onSubmit: (values: CompradorFormValues) => Promise<void>;
}

/** Corrige los datos de quien hizo una reserva, sin tocar el monto ni el estado del pago. */
export function CompradorForm({ initialValues, onCancel, onSubmit }: CompradorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompradorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

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
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className={buttonSecondaryClass}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={buttonPrimaryClass}>
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
