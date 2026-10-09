"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { LADDER, WRONG_ANSWER_DROP, formatEuro } from "@/lib/game";

const ROW_HEIGHT_REM = 2.5;
const ROW_GAP_REM = 0.25;
const ROW_PITCH_REM = ROW_HEIGHT_REM + ROW_GAP_REM;
const STEP_MS = 320;
const START_DELAY_MS = 150;
// Extra rest on each rung the marker passes through while falling.
const DROP_PAUSE_MS = 450;
const TOP_INDEX = LADDER.length - 1;

export function Ladder({ step }: { step: number }) {
  // The marker walks one rung at a time towards `step`, so a drop from 10 000
  // to 500 visibly slides through 3 000 and 1 000 instead of jumping.
  const [shown, setShown] = useState(step);
  const walking = useRef(false);

  useEffect(() => {
    if (shown === step) {
      walking.current = false;
      return;
    }

    const falling = step < shown;
    const delay = !walking.current
      ? START_DELAY_MS
      : falling
        ? STEP_MS + DROP_PAUSE_MS
        : STEP_MS;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const timeout = setTimeout(
      () => {
        walking.current = true;
        setShown((current) => current + Math.sign(step - current));
      },
      reduceMotion ? 0 : delay,
    );

    return () => clearTimeout(timeout);
  }, [shown, step]);

  const rows = LADDER.map((prize, index) => ({ prize, index })).reverse();

  return (
    <aside aria-labelledby="ladder-title">
      <Card padding="md">
        <h2 id="ladder-title" className="text-lg">
          Escada de prémios
        </h2>

        <ol
          role="list"
          className="relative mt-4"
          style={{ display: "grid", gap: `${ROW_GAP_REM}rem` }}
        >
          <li
            aria-hidden="true"
            role="presentation"
            className="pointer-events-none absolute inset-x-0 top-0 rounded-md bg-accent ease-linear motion-reduce:transition-none"
            style={{
              height: `${ROW_HEIGHT_REM}rem`,
              transform: `translateY(${(TOP_INDEX - shown) * ROW_PITCH_REM}rem)`,
              transitionProperty: "transform",
              transitionDuration: `${STEP_MS}ms`,
            }}
          />

          {rows.map(({ prize, index }) => (
            <li
              key={prize}
              aria-current={index === step ? "step" : undefined}
              className={clsx(
                "relative flex items-center justify-between rounded-md px-3 text-sm transition-colors duration-200",
                index === shown
                  ? "font-medium text-accent-foreground"
                  : "text-muted",
              )}
              style={{ height: `${ROW_HEIGHT_REM}rem` }}
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
