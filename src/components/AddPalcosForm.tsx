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
    numeracion: z.enum(["auto", "manual"]),
    numeroInicial: z.coerce.number().int().min(1).default(1),
  })
  .refine((v) => v.numeracion !== "manual" || v.numeroInicial > 0, {
    message: "Indica en qué número empiezan los palcos nuevos",
    path: ["numeroInicial"],
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
      numeracion: "auto",
      numeroInicial: 1,
    },
  });

  const numeracion = watch("numeracion");

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
      <p className="mb-4 text-sm text-text-muted">Actualmente tiene {localidad.palcosConfig.cantidad} palcos.</p>
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

        <div>
          <span className="mb-1.5 block text-sm font-medium text-text-secondary">
            Numeración de los palcos nuevos
          </span>
          <div className="flex flex-col gap-1.5 text-sm text-text-primary sm:flex-row sm:gap-4">
            <label className="flex items-center gap-1.5">
              <input type="radio" value="auto" {...register("numeracion")} />
              Automática — continúa desde el último palco del evento
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" value="manual" {...register("numeracion")} />
              Elegir número inicial
            </label>
          </div>
          {numeracion === "manual" && (
            <div className="mt-2">
              <FormField label="Empezar en el número" error={errors.numeroInicial?.message}>
                <input type="number" min={1} className={inputClass} {...register("numeroInicial")} />
              </FormField>
            </div>
          )}
        </div>

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
