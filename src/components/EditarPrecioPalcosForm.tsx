import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";

const schema = z.object({
  precio: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
});

type EditarPrecioPalcosFormInput = z.input<typeof schema>;
export type EditarPrecioPalcosFormValues = z.output<typeof schema>;

interface EditarPrecioPalcosFormProps {
  precioActual: number;
  onCancel: () => void;
  onSubmit: (values: EditarPrecioPalcosFormValues) => Promise<void>;
}

/** Cambia el precio de los palcos de la localidad que aún no han sido reservados ni vendidos. */
export function EditarPrecioPalcosForm({
  precioActual,
  onCancel,
  onSubmit,
}: EditarPrecioPalcosFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditarPrecioPalcosFormInput, unknown, EditarPrecioPalcosFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { precio: precioActual },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormField label="Precio por palco (COP)" error={errors.precio?.message}>
        <input type="number" min={0} className={inputClass} {...register("precio")} />
      </FormField>
      <p className="text-sm text-text-muted">
        Se aplica a los palcos disponibles (sin reserva ni boletas vendidas); los palcos ya
        reservados o vendidos conservan el precio con el que se registraron.
      </p>
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
