import { cloneElement, isValidElement, useId, type ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  const errorId = useId();

  const field = isValidElement<{ "aria-describedby"?: string; "aria-invalid"?: boolean }>(children)
    ? cloneElement(children, {
        "aria-describedby": error ? errorId : children.props["aria-describedby"],
        "aria-invalid": error ? true : children.props["aria-invalid"],
      })
    : children;

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-text-secondary">{label}</span>
      {field}
      {error && (
        <span id={errorId} role="alert" className="mt-1 block text-sm text-status-critical">
          {error}
        </span>
      )}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-gridline bg-surface-1 px-3 py-2 text-text-primary outline-none focus:border-series-1 focus:ring-1 focus:ring-series-1";

export const buttonPrimaryClass =
  "rounded-lg bg-series-1 px-4 py-2 font-medium text-on-accent transition duration-150 ease-out-strong hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

export const buttonSecondaryClass =
  "rounded-lg border border-gridline bg-surface-1 px-4 py-2 font-medium text-text-primary transition duration-150 ease-out-strong hover:bg-surface-2 active:scale-[0.97]";

export const buttonDangerClass =
  "rounded-lg border border-status-critical px-4 py-2 font-medium text-status-critical transition duration-150 ease-out-strong hover:bg-status-critical/10 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";
