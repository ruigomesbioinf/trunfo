import type { ComponentProps } from "react";
import clsx from "clsx";

export function SeedChip({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={clsx(
        "inline-block rounded-md bg-surface-raised px-3 py-1 font-mono tracking-wider text-accent",
        className,
      )}
      {...props}
    />
  );
}
