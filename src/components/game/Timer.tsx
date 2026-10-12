import clsx from "clsx";

type TimerProps = {
  secondsLeft: number;
  totalSeconds: number;
  isPaused?: boolean;
};

const WARNINGS = [10, 5];

export function Timer({
  secondsLeft,
  totalSeconds,
  isPaused = false,
}: TimerProps) {
  const isLow = secondsLeft <= 10;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted">
          {isPaused ? "Tempo parado" : "Tempo"}
        </span>
        <span
          role="timer"
          className={clsx(
            "font-mono text-xl tabular-nums",
            isLow ? "text-danger" : "text-foreground",
          )}
        >
          {secondsLeft} s
        </span>
      </div>

      <div
        aria-hidden="true"
        className="mt-2 h-2 overflow-hidden rounded-full bg-surface-raised"
      >
        <div
          className={clsx(
            "h-full rounded-full transition-[width] duration-300 ease-linear",
            isPaused ? "bg-muted" : isLow ? "bg-danger" : "bg-accent",
          )}
          style={{ width: `${(secondsLeft / totalSeconds) * 100}%` }}
        />
      </div>

      <p className="sr-only" aria-live="polite">
        {WARNINGS.includes(secondsLeft) ? `Faltam ${secondsLeft} segundos.` : ""}
      </p>
    </div>
  );
}
