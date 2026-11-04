import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { todayISO } from "../lib/format";
import type { Palco } from "../types";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";

function buildSchema(precio: number) {
  return z.object({
    nombre: z.string().min(1, "Requerido"),
    cedula: z.string().min(1, "Requerido"),
    telefono: z.string().min(1, "Requerido"),
    monto: z.coerce
      .number()
      .min(0, "No puede ser negativo")
      .max(precio, `No puede superar el precio del palco (${precio})`),
    fecha: z.string().min(1, "Requerido"),
    metodo: z.enum(["efectivo", "transferencia", "tarjeta"]),
    nota: z.string().optional().default(""),
    cortesia: z.boolean().default(false),
  });
}

type ReservarPalcoFormInput = z.input<ReturnType<typeof buildSchema>>;
export type ReservarPalcoFormValues = z.output<ReturnType<typeof buildSchema>>;

interface ReservarPalcoFormProps {
  palco: Palco;
  onCancel: () => void;
  onSubmit: (values: ReservarPalcoFormValues) => Promise<void>;
}

export function ReservarPalcoForm({ palco, onCancel, onSubmit }: ReservarPalcoFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReservarPalcoFormInput, unknown, ReservarPalcoFormValues>({
    resolver: zodResolver(buildSchema(palco.precio)),
    defaultValues: { fecha: todayISO(), metodo: "efectivo", monto: 0, cortesia: false },
  });
  const esCortesia = watch("cortesia");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormField label="Nombre del comprador" error={errors.nombre?.message}>
        <input className={inputClass} {...register("nombre")} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Cédula" error={errors.cedula?.message}>
          <input className={inputClass} {...register("cedula")} />
        </FormField>
        <FormField label="Teléfono" error={errors.telefono?.message}>
          <input className={inputClass} {...register("telefono")} />
        </FormField>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm text-text-primary">
        <input type="checkbox" className="h-4 w-4" {...register("cortesia")} />
        Palco de cortesía
      </label>
      {!esCortesia && (
        <>
          <FormField label={`Abono inicial (precio del palco: ${palco.precio})`} error={errors.monto?.message}>
            <input type="number" min={0} className={inputClass} {...register("monto")} />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Fecha del abono" error={errors.fecha?.message}>
              <input type="date" className={inputClass} {...register("fecha")} />
            </FormField>
            <FormField label="Método de pago" error={errors.metodo?.message}>
              <select className={inputClass} {...register("metodo")}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </FormField>
          </div>
        </>
      )}
      <FormField label="Nota (opcional)" error={errors.nota?.message}>
        <input className={inputClass} {...register("nota")} />
      </FormField>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className={buttonSecondaryClass}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={buttonPrimaryClass}>
          Reservar palco
        </button>
      </div>
    </form>
  );
}
