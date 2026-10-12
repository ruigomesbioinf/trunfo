import type { ComponentProps } from "react";
import Link from "next/link";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "lg";

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:brightness-110 active:translate-y-px",
  secondary:
    "border border-border-strong bg-surface-raised text-foreground hover:bg-surface active:translate-y-px",
  ghost:
    "text-muted hover:bg-surface-raised hover:text-foreground active:translate-y-px",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-13 px-6 text-base",
};

const baseStyles =
  "relative inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "transition-[color,background-color,filter,transform] duration-150 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

function getButtonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return clsx(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}

function LoadingOverlay() {
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      <span className="sr-only">A carregar</span>
    </span>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={isLoading ? true : undefined}
      className={getButtonClasses({
        variant,
        size,
        className,
      })}
      {...props}
    >
      <span className={isLoading ? "invisible" : undefined}>{children}</span>

      {isLoading && <LoadingOverlay />}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      aria-busy={isLoading ? true : undefined}
      className={getButtonClasses({
        variant,
        size,
        className,
      })}
      {...props}
    >
      <span className={isLoading ? "invisible" : undefined}>{children}</span>

      {isLoading && <LoadingOverlay />}
    </Link>
  );
}
