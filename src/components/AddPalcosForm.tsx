import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Localidad } from "../types";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";
import { Modal } from "./Modal";

const schema = z
  .object({
    cantidad: z.coerce.number().int().min(1, "Debe ser al menos 1"),
    capacidad: z.coerce.number().int().min(1, "Requerido"),
    precio: z.coerce.number().min(0, "Requerido"),
    vendiblePorBoleta: z.boolean(),
    precioBoleta: z.coerce.number().min(0).default(0),
  })
  .refine((v) => !v.vendiblePorBoleta || v.precioBoleta > 0, {
    message: "Indica el precio por boleta",
    path: ["precioBoleta"],
  });

export type AddPalcosFormValues = z.output<typeof schema>;
type AddPalcosFormInput = z.input<typeof schema>;

interface AddPalcosFormProps {
  localidad: Localidad;
  onClose: () => void;
  onSubmit: (values: AddPalcosFormValues) => Promise<void>;
}

export function AddPalcosForm({ localidad, onClose, onSubmit }: AddPalcosFormProps) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddPalcosFormInput, unknown, AddPalcosFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      capacidad: localidad.palcosConfig.capacidadPorPalco || undefined,
      precio: localidad.palcosConfig.precio || undefined,
      vendiblePorBoleta: false,
      precioBoleta: 0,
    },
  });

  const vendiblePorBoleta = watch("vendiblePorBoleta");

  async function submit(values: AddPalcosFormValues) {
    setError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron agregar los palcos");
    }
  }

  return (
    <Modal title={`Agregar palcos a ${localidad.nombre}`} onClose={onClose}>
      <p className="mb-4 text-sm text-text-muted">
        Actualmente tiene {localidad.palcosConfig.cantidad} palcos. Los nuevos se numerarán a
        continuación.
      </p>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <FormField label="Cantidad de palcos nuevos" error={errors.cantidad?.message}>
          <input type="number" min={1} className={inputClass} {...register("cantidad")} />
        </FormField>
        <FormField label="Capacidad por palco" error={errors.capacidad?.message}>
          <input type="number" min={1} className={inputClass} {...register("capacidad")} />
        </FormField>
        <FormField label="Precio (COP)" error={errors.precio?.message}>
          <input type="number" min={0} className={inputClass} {...register("precio")} />
        </FormField>
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <input type="checkbox" {...register("vendiblePorBoleta")} />
          También se pueden vender por boleta suelta (asiento por asiento)
        </label>
        {vendiblePorBoleta && (
          <FormField label="Precio por boleta (COP)" error={errors.precioBoleta?.message}>
            <input type="number" min={0} className={inputClass} {...register("precioBoleta")} />
          </FormField>
        )}
        {error && <p className="text-sm text-status-critical">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={buttonSecondaryClass}>
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className={buttonPrimaryClass}>
            Agregar palcos
          </button>
        </div>
      </form>
    </Modal>
  );
}
