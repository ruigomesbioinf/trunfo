export type GameMode = "solo" | "multiplayer";

export const GAME_MODES: readonly GameMode[] = ["solo", "multiplayer"];

// Where each mode lives in the app.
export const MODE_PATHS: Record<GameMode, string> = {
  solo: "/solo",
  multiplayer: "/multijogador",
};

export function isGameMode(value: unknown): value is GameMode {
  return GAME_MODES.some((mode) => mode === value);
}
