import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";

function buildSchema(maxCantidad: number) {
  return z.object({
    cantidad: z.coerce
      .number()
      .int()
      .min(1, "Debe ser al menos 1")
      .max(maxCantidad, `Máximo ${maxCantidad} boletas (cupo del palco)`),
  });
}

type EditarCantidadBoletaFormInput = z.input<ReturnType<typeof buildSchema>>;
export type EditarCantidadBoletaFormValues = z.output<ReturnType<typeof buildSchema>>;

interface EditarCantidadBoletaFormProps {
  cantidadActual: number;
  maxCantidad: number;
  onCancel: () => void;
  onSubmit: (values: EditarCantidadBoletaFormValues) => Promise<void>;
}

/** Corrige cuántas sillas compró un cliente dentro de una venta de boleta suelta ya registrada. */
export function EditarCantidadBoletaForm({
  cantidadActual,
  maxCantidad,
  onCancel,
  onSubmit,
}: EditarCantidadBoletaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditarCantidadBoletaFormInput, unknown, EditarCantidadBoletaFormValues>({
    resolver: zodResolver(buildSchema(maxCantidad)),
    defaultValues: { cantidad: cantidadActual },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormField label={`Cantidad de boletas (cupo máximo: ${maxCantidad})`} error={errors.cantidad?.message}>
        <input type="number" min={1} className={inputClass} {...register("cantidad")} />
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
