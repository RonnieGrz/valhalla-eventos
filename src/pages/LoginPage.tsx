import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { buttonPrimaryClass, FormField, inputClass } from "../components/form/FormField";
import { useAuth } from "../context/AuthContext";

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { user, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await login(values.email, values.password);
    } catch {
      setError("No se pudo iniciar sesión. Verifica tus credenciales.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gridline bg-surface-1 p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-text-primary">Valhalla Eventos</h1>
        <p className="mb-5 text-sm text-text-muted">Ingresa con tu cuenta del equipo</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Correo" error={errors.email?.message}>
            <input type="email" className={inputClass} {...register("email")} />
          </FormField>
          <FormField label="Contraseña" error={errors.password?.message}>
            <input type="password" className={inputClass} {...register("password")} />
          </FormField>
          {error && <p className="text-sm text-status-critical">{error}</p>}
          <button type="submit" disabled={isSubmitting} className={`${buttonPrimaryClass} w-full`}>
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
