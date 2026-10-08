"use client";

import { useState, type ComponentProps } from "react";
import { Button } from "./Button";

type CopyButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  // A function so values that depend on the browser (such as the page URL)
  // are only read when the button is clicked.
  getText: () => string;
};

type Status = "idle" | "copied" | "error";

export function CopyButton({ getText, children, ...props }: CopyButtonProps) {
  const [status, setStatus] = useState<Status>("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(getText());
      setStatus("copied");
    } catch {
      setStatus("error");
    }

    setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <>
      <Button onClick={copy} {...props}>
        {status === "copied" ? "Copiado ✓" : children}
      </Button>

      <span className="sr-only" aria-live="polite">
        {status === "copied" && "Copiado para a área de transferência."}
        {status === "error" && "Não foi possível copiar."}
      </span>

      {status === "error" && (
        <span aria-hidden="true" className="text-sm text-danger">
          Não foi possível copiar.
        </span>
      )}
    </>
  );
}
