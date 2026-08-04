import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buttonSecondaryClass, FormField, inputClass } from "./form/FormField";

const schema = z
  .object({
    vendiblePorBoleta: z.boolean(),
    precioBoleta: z.coerce.number().min(0).default(0),
  })
  .refine((v) => !v.vendiblePorBoleta || v.precioBoleta > 0, {
    message: "Indica el precio por boleta",
    path: ["precioBoleta"],
  });

export type PalcoBoletaSettingsValues = z.output<typeof schema>;
type PalcoBoletaSettingsInput = z.input<typeof schema>;

interface PalcoBoletaSettingsFormProps {
  vendiblePorBoleta: boolean;
  precioBoleta: number;
  onSubmit: (values: PalcoBoletaSettingsValues) => Promise<void>;
}

/** Permite decidir, palco por palco, si además se puede vender asiento por asiento. */
export function PalcoBoletaSettingsForm({
  vendiblePorBoleta,
  precioBoleta,
  onSubmit,
}: PalcoBoletaSettingsFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PalcoBoletaSettingsInput, unknown, PalcoBoletaSettingsValues>({
    resolver: zodResolver(schema),
    defaultValues: { vendiblePorBoleta, precioBoleta },
  });

  const habilitado = watch("vendiblePorBoleta");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mb-4 space-y-3 rounded-lg border border-gridline p-3"
    >
      <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
        <input type="checkbox" {...register("vendiblePorBoleta")} />
        Vendible por boleta suelta (asiento por asiento)
      </label>
      {habilitado && (
        <FormField label="Precio por boleta (COP)" error={errors.precioBoleta?.message}>
          <input type="number" min={0} className={inputClass} {...register("precioBoleta")} />
        </FormField>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting} className={buttonSecondaryClass}>
          Guardar
        </button>
      </div>
    </form>
  );
}
