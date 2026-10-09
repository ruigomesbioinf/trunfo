export const LADDER = [0, 200, 500, 1000, 3000, 10000, 50000] as const;

export type Prize = (typeof LADDER)[number];

export const WRONG_ANSWER_DROP = 3;
export const SECONDS_PER_QUESTION = 30;

// Every game starts with this many trunfos. They are a help (see
// trunfoElimination in questions.ts) and also cushion a fall (see resolveAnswer).
export const TRUNFOS_AT_START = 7;

// A question has 4 options and each trunfo eliminates one that is wrong, so
// with 3 trunfos on the same question only the correct option is left.
export const MAX_TRUNFOS_PER_QUESTION = 3;

const TOP_STEP = LADDER.length - 1;

// The difficulty of the question asked while the player is on each step of the
// ladder, by prize. Two difficulties mean a draw: each has the same chance.
const DIFFICULTY_BY_PRIZE = {
  0: [1],
  200: [1],
  500: [1, 2],
  1000: [2],
  3000: [2, 3],
  10000: [3],
  50000: [3],
} as const satisfies Record<Prize, readonly (1 | 2 | 3)[]>;

// A question already played: whether it was answered correctly (a timeout
// counts as wrong) and how many trunfos were played on it as a help.
export type Answer = { correct: boolean; trunfosUsed: number };

export type Progress = { step: number; trunfos: number };

export type Outcome = Progress & { trunfosLost: number };

// Where the player ends up after answering, holding `trunfos` at that moment
// (the ones played as a help on this question are already spent).
// A correct answer climbs one step, up to the top. A wrong answer or a timeout
// drops WRONG_ANSWER_DROP steps, but every trunfo the player holds, up to that
// many, absorbs one step of the fall and is spent doing it. That happens on
// every step, even when there is little or nothing left to fall.
export function resolveAnswer(
  step: number,
  trunfos: number,
  correct: boolean,
): Outcome {
  if (correct) {
    return { step: Math.min(step + 1, TOP_STEP), trunfos, trunfosLost: 0 };
  }

  const trunfosLost = Math.min(trunfos, WRONG_ANSWER_DROP);

  return {
    step: Math.max(step - (WRONG_ANSWER_DROP - trunfosLost), 0),
    trunfos: trunfos - trunfosLost,
    trunfosLost,
  };
}

// Where the player stands after playing these questions in order, from the
// start of a game. Throws if the answers cannot have happened.
export function progressAfter(answers: readonly Answer[]): Progress {
  return answers.reduce<Progress>(
    ({ step, trunfos }, { correct, trunfosUsed }) => {
      if (
        !Number.isInteger(trunfosUsed) ||
        trunfosUsed < 0 ||
        trunfosUsed > MAX_TRUNFOS_PER_QUESTION ||
        trunfosUsed > trunfos
      ) {
        throw new Error(`Cannot play ${trunfosUsed} trunfos holding ${trunfos}.`);
      }

      const outcome = resolveAnswer(step, trunfos - trunfosUsed, correct);

      return { step: outcome.step, trunfos: outcome.trunfos };
    },
    { step: 0, trunfos: TRUNFOS_AT_START },
  );
}

export function prizeAt(step: number): Prize {
  return LADDER[Math.min(Math.max(step, 0), TOP_STEP)];
}

// `roll` is a number in [0, 1) that settles the draw on the steps that have
// two difficulties: the lower half picks the first, the upper half the second.
export function difficultyForStep(step: number, roll: number): 1 | 2 | 3 {
  const options = DIFFICULTY_BY_PRIZE[prizeAt(step)];

  return options[
    Math.min(Math.floor(roll * options.length), options.length - 1)
  ];
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
  trunfosLost: number;
};

export type GameState = {
  phase: GamePhase;
  total: number;
  index: number;
  step: number;
  trunfos: number;
  // Options of the current question already eliminated by trunfos.
  eliminated: number[];
  answers: Answer[];
  feedback: Feedback | null;
};

export type GameAction =
  | { type: "start" }
  | { type: "trunfoPlayed"; eliminated: number }
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
    trunfos: TRUNFOS_AT_START,
    eliminated: [],
    answers: [],
    feedback: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "start":
      return state.phase === "intro" ? { ...state, phase: "answering" } : state;

    case "trunfoPlayed": {
      if (
        state.phase !== "answering" ||
        state.trunfos < 1 ||
        state.eliminated.length >= MAX_TRUNFOS_PER_QUESTION ||
        state.eliminated.includes(action.eliminated)
      ) {
        return state;
      }

      return {
        ...state,
        trunfos: state.trunfos - 1,
        eliminated: [...state.eliminated, action.eliminated],
      };
    }

    case "answered": {
      if (state.phase !== "answering") return state;

      const outcome = resolveAnswer(state.step, state.trunfos, action.correct);

      return {
        ...state,
        phase: "feedback",
        step: outcome.step,
        trunfos: outcome.trunfos,
        answers: [
          ...state.answers,
          { correct: action.correct, trunfosUsed: state.eliminated.length },
        ],
        feedback: {
          selected: action.selected,
          correct: action.correct,
          correctIndex: action.correctIndex,
          fromStep: state.step,
          toStep: outcome.step,
          trunfosLost: outcome.trunfosLost,
        },
      };
    }

    case "next": {
      if (state.phase !== "feedback") return state;

      const index = state.index + 1;

      return index >= state.total
        ? { ...state, phase: "finished", eliminated: [], feedback: null }
        : { ...state, phase: "answering", index, eliminated: [], feedback: null };
    }
  }
}
