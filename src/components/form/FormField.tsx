import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-text-secondary">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-status-critical">{error}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-gridline bg-surface-1 px-3 py-2 text-text-primary outline-none focus:border-series-1 focus:ring-1 focus:ring-series-1";

export const buttonPrimaryClass =
  "rounded-lg bg-series-1 px-4 py-2 font-medium text-on-accent hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonSecondaryClass =
  "rounded-lg border border-gridline bg-surface-1 px-4 py-2 font-medium text-text-primary hover:bg-surface-2";

export const buttonDangerClass =
  "rounded-lg border border-status-critical px-4 py-2 font-medium text-status-critical hover:bg-status-critical/10 disabled:cursor-not-allowed disabled:opacity-50";
