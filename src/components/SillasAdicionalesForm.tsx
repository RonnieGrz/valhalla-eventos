import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";

const schema = z
  .object({
    sillasAdicionalesVendidas: z.coerce.number().int().min(0, "No puede ser negativo"),
    sillasAdicionalesCortesia: z.coerce.number().int().min(0, "No puede ser negativo"),
    precioSillaAdicional: z.coerce.number().min(0, "No puede ser negativo"),
  })
  .refine((v) => v.sillasAdicionalesVendidas === 0 || v.precioSillaAdicional > 0, {
    message: "Indica el precio por silla adicional vendida",
    path: ["precioSillaAdicional"],
  });

type SillasAdicionalesFormInput = z.input<typeof schema>;
export type SillasAdicionalesFormValues = z.output<typeof schema>;

interface SillasAdicionalesFormProps {
  initialValues: SillasAdicionalesFormValues;
  onCancel: () => void;
  onSubmit: (values: SillasAdicionalesFormValues) => Promise<void>;
}

/**
 * Fija cuántas sillas adicionales (fuera de la capacidad base) tiene un palco ya reservado:
 * separa las vendidas (con precio) de las de cortesía (sin costo, no suman al monto comprometido).
 */
export function SillasAdicionalesForm({ initialValues, onCancel, onSubmit }: SillasAdicionalesFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SillasAdicionalesFormInput, unknown, SillasAdicionalesFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormField label="Sillas adicionales vendidas" error={errors.sillasAdicionalesVendidas?.message}>
        <input type="number" min={0} className={inputClass} {...register("sillasAdicionalesVendidas")} />
      </FormField>
      <FormField label="Precio por silla vendida (COP)" error={errors.precioSillaAdicional?.message}>
        <input type="number" min={0} className={inputClass} {...register("precioSillaAdicional")} />
      </FormField>
      <FormField label="Sillas adicionales de cortesía" error={errors.sillasAdicionalesCortesia?.message}>
        <input type="number" min={0} className={inputClass} {...register("sillasAdicionalesCortesia")} />
      </FormField>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className={buttonSecondaryClass}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={buttonPrimaryClass}>
          Guardar
        </button>
      </div>
    </form>
  );
}
