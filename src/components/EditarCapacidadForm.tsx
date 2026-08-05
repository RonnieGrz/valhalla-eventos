import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";

function buildSchema(minCapacidad: number) {
  return z.object({
    capacidad: z.coerce
      .number()
      .int()
      .min(minCapacidad, `No puede ser menor a ${minCapacidad} (ya vendidas)`),
  });
}

type EditarCapacidadFormInput = z.input<ReturnType<typeof buildSchema>>;
export type EditarCapacidadFormValues = z.output<ReturnType<typeof buildSchema>>;

interface EditarCapacidadFormProps {
  capacidadActual: number;
  minCapacidad: number;
  onCancel: () => void;
  onSubmit: (values: EditarCapacidadFormValues) => Promise<void>;
}

/** Corrige el cupo de un palco puntual: puede subirse por encima del valor con el que se creó. */
export function EditarCapacidadForm({
  capacidadActual,
  minCapacidad,
  onCancel,
  onSubmit,
}: EditarCapacidadFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditarCapacidadFormInput, unknown, EditarCapacidadFormValues>({
    resolver: zodResolver(buildSchema(minCapacidad)),
    defaultValues: { capacidad: capacidadActual },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormField label="Cupo (capacidad) del palco" error={errors.capacidad?.message}>
        <input type="number" min={minCapacidad} className={inputClass} {...register("capacidad")} />
      </FormField>
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
