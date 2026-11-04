import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  cedula: z.string().optional().default(""),
  telefono: z.string().optional().default(""),
});

type CortesiaFormInput = z.input<typeof schema>;
export type CortesiaFormValues = z.output<typeof schema>;

interface CortesiaFormProps {
  onCancel: () => void;
  onSubmit: (values: CortesiaFormValues) => Promise<void>;
}

/** Datos de la persona o entidad a la que se entregan los palcos de cortesía; solo el nombre es obligatorio. */
export function CortesiaForm({ onCancel, onSubmit }: CortesiaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CortesiaFormInput, unknown, CortesiaFormValues>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormField label="Persona o entidad" error={errors.nombre?.message}>
        <input className={inputClass} {...register("nombre")} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Cédula o NIT (opcional)" error={errors.cedula?.message}>
          <input className={inputClass} {...register("cedula")} />
        </FormField>
        <FormField label="Teléfono (opcional)" error={errors.telefono?.message}>
          <input className={inputClass} {...register("telefono")} />
        </FormField>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className={buttonSecondaryClass}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={buttonPrimaryClass}>
          Marcar como cortesía
        </button>
      </div>
    </form>
  );
}
