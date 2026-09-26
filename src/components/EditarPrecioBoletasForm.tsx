import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";

const schema = z.object({
  precioUnitario: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
});

type EditarPrecioBoletasFormInput = z.input<typeof schema>;
export type EditarPrecioBoletasFormValues = z.output<typeof schema>;

interface EditarPrecioBoletasFormProps {
  precioActual: number;
  onCancel: () => void;
  onSubmit: (values: EditarPrecioBoletasFormValues) => Promise<void>;
}

/** Cambia el precio unitario de las boletas sueltas de la localidad (p. ej. al pasar de preventa a precio full). */
export function EditarPrecioBoletasForm({
  precioActual,
  onCancel,
  onSubmit,
}: EditarPrecioBoletasFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditarPrecioBoletasFormInput, unknown, EditarPrecioBoletasFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { precioUnitario: precioActual },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormField label="Precio unitario (COP)" error={errors.precioUnitario?.message}>
        <input type="number" min={0} className={inputClass} {...register("precioUnitario")} />
      </FormField>
      <p className="text-sm text-text-muted">
        Solo aplica a las ventas nuevas; las boletas ya vendidas conservan el precio con el que se
        registraron.
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
