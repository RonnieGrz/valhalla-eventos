import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";
import { Modal } from "./Modal";

const schema = z
  .object({
    nombre: z.string().min(1, "Requerido"),
    tienePalcos: z.boolean(),
    palcosCantidad: z.coerce.number().int().min(0).default(0),
    palcosCapacidad: z.coerce.number().int().min(0).default(0),
    palcosPrecio: z.coerce.number().min(0).default(0),
    palcosNumeracion: z.enum(["auto", "manual"]),
    palcosNumeroInicial: z.coerce.number().int().min(1).default(1),
    tieneBoletas: z.boolean(),
    boletasAforo: z.coerce.number().int().min(0).default(0),
    boletasPrecio: z.coerce.number().min(0).default(0),
  })
  .refine((v) => !v.tienePalcos || v.palcosCantidad > 0, {
    message: "Indica cuántos palcos tiene la localidad",
    path: ["palcosCantidad"],
  })
  .refine((v) => !v.tienePalcos || v.palcosCapacidad > 0, {
    message: "Indica la capacidad por palco",
    path: ["palcosCapacidad"],
  })
  .refine((v) => !v.tienePalcos || v.palcosNumeracion !== "manual" || v.palcosNumeroInicial > 0, {
    message: "Indica en qué número empiezan los palcos",
    path: ["palcosNumeroInicial"],
  })
  .refine((v) => !v.tieneBoletas || v.boletasAforo > 0, {
    message: "Indica el aforo de boletas sueltas",
    path: ["boletasAforo"],
  })
  .refine((v) => v.tienePalcos || v.tieneBoletas, {
    message: "La localidad debe tener palcos, boletas sueltas, o ambos",
    path: ["tienePalcos"],
  });

export type LocalityFormValues = z.output<typeof schema>;
type LocalityFormInput = z.input<typeof schema>;

interface LocalityFormProps {
  onClose: () => void;
  onSubmit: (values: LocalityFormValues) => Promise<void>;
}

export function LocalityForm({ onClose, onSubmit }: LocalityFormProps) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LocalityFormInput, unknown, LocalityFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tienePalcos: true,
      tieneBoletas: false,
      palcosCantidad: 0,
      palcosCapacidad: 0,
      palcosPrecio: 0,
      palcosNumeracion: "auto",
      palcosNumeroInicial: 1,
      boletasAforo: 0,
      boletasPrecio: 0,
    },
  });

  const tienePalcos = watch("tienePalcos");
  const tieneBoletas = watch("tieneBoletas");
  const palcosNumeracion = watch("palcosNumeracion");

  async function submit(values: LocalityFormValues) {
    setError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la localidad");
    }
  }

  return (
    <Modal title="Nueva localidad" onClose={onClose} widthClass="max-w-lg">
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <FormField label="Nombre de la localidad" error={errors.nombre?.message}>
          <input className={inputClass} placeholder="Ej. Palcos VIP, Platea General" {...register("nombre")} />
        </FormField>

        <div className="rounded-lg border border-gridline p-3">
          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
            <input type="checkbox" {...register("tienePalcos")} />
            Incluye palcos
          </label>
          {tienePalcos && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Cantidad" error={errors.palcosCantidad?.message}>
                  <input type="number" min={0} className={inputClass} {...register("palcosCantidad")} />
                </FormField>
                <FormField label="Capacidad c/u" error={errors.palcosCapacidad?.message}>
                  <input type="number" min={0} className={inputClass} {...register("palcosCapacidad")} />
                </FormField>
                <FormField label="Precio (COP)" error={errors.palcosPrecio?.message}>
                  <input type="number" min={0} className={inputClass} {...register("palcosPrecio")} />
                </FormField>
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Numeración de los palcos
                </span>
                <div className="flex flex-col gap-1.5 text-sm text-text-primary sm:flex-row sm:gap-4">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" value="auto" {...register("palcosNumeracion")} />
                    Automática — continúa desde el último palco del evento
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" value="manual" {...register("palcosNumeracion")} />
                    Elegir número inicial
                  </label>
                </div>
                {palcosNumeracion === "manual" && (
                  <div className="mt-2">
                    <FormField
                      label="Empezar en el número"
                      error={errors.palcosNumeroInicial?.message}
                    >
                      <input
                        type="number"
                        min={1}
                        className={inputClass}
                        {...register("palcosNumeroInicial")}
                      />
                    </FormField>
                  </div>
                )}
              </div>

              <p className="text-sm text-text-muted">
                Si un palco en particular también se puede vender por boleta suelta (asiento por
                asiento), esa opción se activa después, abriendo ese palco.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gridline p-3">
          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
            <input type="checkbox" {...register("tieneBoletas")} />
            Incluye boletas sueltas (preventa)
          </label>
          {tieneBoletas && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Aforo" error={errors.boletasAforo?.message}>
                <input type="number" min={0} className={inputClass} {...register("boletasAforo")} />
              </FormField>
              <FormField label="Precio unitario (COP)" error={errors.boletasPrecio?.message}>
                <input type="number" min={0} className={inputClass} {...register("boletasPrecio")} />
              </FormField>
            </div>
          )}
        </div>

        {errors.tienePalcos && (
          <p className="text-sm text-status-critical">{errors.tienePalcos.message}</p>
        )}
        {error && <p className="text-sm text-status-critical">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={buttonSecondaryClass}>
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className={buttonPrimaryClass}>
            Crear localidad
          </button>
        </div>
      </form>
    </Modal>
  );
}
