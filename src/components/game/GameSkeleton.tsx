import { Card } from "@/components/ui/Card";
import type { GameMode } from "@/lib/modes";

// How many lines each item of the intro list takes on a wide screen.
const ITEM_LINES: Record<GameMode, readonly number[]> = {
  solo: [1, 1, 1, 2, 3, 1],
  multiplayer: [2, 1, 1, 2, 3, 1],
};

const BAR = "rounded bg-border";

function lineWidth(line: number, lines: number) {
  if (lines === 1) return "w-3/4";

  return line === lines - 1 ? "w-2/3" : "w-full";
}

type GameSkeletonProps = {
  mode: GameMode;
};

// Shown while a game page is on its way. It has the size and shape of the
// "Pronto para jogar?" screen, so nothing jumps when that one appears and the
// main area is never empty, which is what pulled the footer up to the header.
export function GameSkeleton({ mode }: GameSkeletonProps) {
  return (
    <main id="main-content" tabIndex={-1} aria-busy="true" className="flex-1">
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <Card padding="lg">
          <p role="status" className="sr-only">
            A preparar o jogo…
          </p>

          <div aria-hidden="true" className="animate-pulse">
            <div className="flex h-9.5 items-center">
              <div className={`h-7 w-3/5 ${BAR}`} />
            </div>

            <div className="mt-6 space-y-2">
              {ITEM_LINES[mode].map((lines, item) => (
                <div key={item}>
                  {Array.from({ length: lines }, (_, line) => (
                    <div key={line} className="py-1">
                      <div
                        className={`h-4 ${BAR} ${lineWidth(line, lines)}`}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {mode === "multiplayer" && (
              <div className="mt-8 border-t border-border pt-6">
                <div className="flex h-5 items-center">
                  <div className={`h-3.5 w-4/5 ${BAR}`} />
                </div>
                <div className="mt-2 flex h-11 items-center gap-3">
                  <div className={`h-9 w-36 ${BAR}`} />
                  <div className={`h-7 w-28 ${BAR}`} />
                </div>
              </div>
            )}

            <div className={`mt-8 h-13 w-full ${BAR}`} />
          </div>
        </Card>
      </div>
    </main>
  );
}
