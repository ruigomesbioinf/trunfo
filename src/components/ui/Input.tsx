import { useId, type ComponentProps } from "react";
import clsx from "clsx";

type InputProps = ComponentProps<"input"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Input({
  id,
  label,
  hint,
  error,
  required,
  disabled,
  className,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <>
            <span aria-hidden="true"> *</span>
            <span className="sr-only"> (obrigatório)</span>
          </>
        )}
      </label>

      <input
        id={inputId}
        required={required}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={clsx(
            "min-h-11 w-full rounded-md border bg-surface-raised px-3 text-base text-foreground",
            "placeholder:text-muted",
            error ? "border-danger" : "border-border-strong",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
        )}
        {...props}
      />

      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-sm text-danger"
        >
          <svg
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M8 5v4M8 11.5v.5M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
