import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { LADDER, WRONG_ANSWER_DROP, formatEuro } from "@/lib/game";

export function Ladder({ step }: { step: number }) {
  const rows = LADDER.map((prize, index) => ({ prize, index })).reverse();

  return (
    <aside aria-labelledby="ladder-title">
      <Card padding="md">
        <h2 id="ladder-title" className="text-lg">
          Escada de prémios
        </h2>

        <ol role="list" className="mt-4 space-y-1">
          {rows.map(({ prize, index }) => (
            <li
              key={prize}
              aria-current={index === step ? "step" : undefined}
              className={clsx(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm",
                index === step
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted",
              )}
            >
              <span className="font-mono tabular-nums">{formatEuro(prize)}</span>
              {index === step && <span className="sr-only">(degrau atual)</span>}
            </li>
          ))}
        </ol>

        <p className="mt-4 text-sm text-muted">
          Certa: sobes 1 degrau. Errada: desces {WRONG_ANSWER_DROP}.
        </p>
      </Card>
    </aside>
  );
}
