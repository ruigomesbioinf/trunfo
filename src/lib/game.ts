export const LADDER = [0, 200, 500, 1000, 3000, 10000, 50000] as const;

export const WRONG_ANSWER_DROP = 3;
export const SECONDS_PER_QUESTION = 30;

const TOP_STEP = LADDER.length - 1;

// A correct answer climbs one step (up to the top); a wrong answer or a
// timeout drops three steps (never below zero).
export function nextStep(step: number, correct: boolean): number {
  return correct
    ? Math.min(step + 1, TOP_STEP)
    : Math.max(step - WRONG_ANSWER_DROP, 0);
}

export function prizeAt(step: number): number {
  return LADDER[Math.min(Math.max(step, 0), TOP_STEP)];
}

// pt-PT style: "200 €", "1000 €", "10 000 €". Written by hand instead of Intl
// so the server and the browser always produce the exact same text.
export function formatEuro(amount: number): string {
  const digits = String(amount);
  const grouped =
    digits.length >= 5 ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") : digits;

  return `${grouped}\u00a0€`;
}

export type GamePhase = "intro" | "answering" | "feedback" | "finished";

export type Feedback = {
  selected: number | null;
  correct: boolean;
  correctIndex: number;
  fromStep: number;
  toStep: number;
};

export type GameState = {
  phase: GamePhase;
  total: number;
  index: number;
  step: number;
  answers: boolean[];
  feedback: Feedback | null;
};

export type GameAction =
  | { type: "start" }
  | {
      type: "answered";
      selected: number | null;
      correct: boolean;
      correctIndex: number;
    }
  | { type: "next" };

export function createGameState(total: number): GameState {
  return {
    phase: "intro",
    total,
    index: 0,
    step: 0,
    answers: [],
    feedback: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "start":
      return state.phase === "intro" ? { ...state, phase: "answering" } : state;

    case "answered": {
      if (state.phase !== "answering") return state;

      const toStep = nextStep(state.step, action.correct);

      return {
        ...state,
        phase: "feedback",
        step: toStep,
        answers: [...state.answers, action.correct],
        feedback: {
          selected: action.selected,
          correct: action.correct,
          correctIndex: action.correctIndex,
          fromStep: state.step,
          toStep,
        },
      };
    }

    case "next": {
      if (state.phase !== "feedback") return state;

      const index = state.index + 1;

      return index >= state.total
        ? { ...state, phase: "finished", feedback: null }
        : { ...state, phase: "answering", index, feedback: null };
    }
  }
}
