import type { ComponentProps } from "react";
import clsx from "clsx";

type CardProps = ComponentProps<"div"> & {
  padding?: "md" | "lg";
};

const paddingStyles: Record<NonNullable<CardProps["padding"]>, string> = {
  md: "p-4",
  lg: "p-6",
};

export function Card({
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-border bg-surface shadow-card",
        paddingStyles[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
