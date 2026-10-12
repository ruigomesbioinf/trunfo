"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ComponentProps, type MouseEvent } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { MODE_PATHS, type GameMode } from "@/lib/modes";
import { generateSeed } from "@/lib/seed";

type NewGameLinkProps = Omit<
  ComponentProps<typeof ButtonLink>,
  "href" | "prefetch" | "onClick" | "isLoading"
> & {
  mode: GameMode;
};

export function NewGameLink({ mode, children, ...props }: NewGameLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    if (isPending) return;

    startTransition(() => {
      router.push(`${MODE_PATHS[mode]}/${generateSeed()}`);
    });
  }

  return (
    <ButtonLink
      {...props}
      href={MODE_PATHS[mode]}
      prefetch={false}
      isLoading={isPending}
      onClick={handleClick}
    >
      {children}
    </ButtonLink>
  );
}
