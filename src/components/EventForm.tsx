import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buttonPrimaryClass, buttonSecondaryClass, FormField, inputClass } from "./form/FormField";
import { Modal } from "./Modal";

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  lugar: z.string().min(1, "Requerido"),
  fecha: z.string().min(1, "Requerido"),
  descripcion: z.string().optional(),
});

export type EventFormValues = z.infer<typeof schema>;

interface EventFormProps {
  onClose: () => void;
  onSubmit: (values: EventFormValues) => Promise<void>;
}

export function EventForm({ onClose, onSubmit }: EventFormProps) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({ resolver: zodResolver(schema) });

  async function submit(values: EventFormValues) {
    setError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el evento");
    }
  }

  return (
    <Modal title="Nuevo evento" onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <FormField label="Nombre del evento" error={errors.nombre?.message}>
          <input className={inputClass} {...register("nombre")} />
        </FormField>
        <FormField label="Lugar" error={errors.lugar?.message}>
          <input className={inputClass} {...register("lugar")} />
        </FormField>
        <FormField label="Fecha" error={errors.fecha?.message}>
          <input type="date" className={inputClass} {...register("fecha")} />
        </FormField>
        <FormField label="Descripción (opcional)" error={errors.descripcion?.message}>
          <textarea className={inputClass} rows={3} {...register("descripcion")} />
        </FormField>
        {error && <p className="text-sm text-status-critical">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={buttonSecondaryClass}>
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className={buttonPrimaryClass}>
            Crear evento
          </button>
        </div>
      </form>
    </Modal>
  );
}
