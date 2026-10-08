import { describe, expect, it } from "vitest";
import {
  LADDER,
  createGameState,
  formatEuro,
  gameReducer,
  nextStep,
  prizeAt,
  type GameAction,
  type GameState,
} from "./game";

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}

const right: GameAction = {
  type: "answered",
  selected: 0,
  correct: true,
  correctIndex: 0,
};
const wrong: GameAction = {
  type: "answered",
  selected: 1,
  correct: false,
  correctIndex: 0,
};
const next: GameAction = { type: "next" };

describe("ladder", () => {
  it("has the agreed steps", () => {
    expect([...LADDER]).toEqual([0, 200, 500, 1000, 3000, 10000, 50000]);
  });

  it("prizeAt returns the prize of a step and clamps out-of-range steps", () => {
    expect(prizeAt(0)).toBe(0);
    expect(prizeAt(3)).toBe(1000);
    expect(prizeAt(6)).toBe(50000);
    expect(prizeAt(-1)).toBe(0);
    expect(prizeAt(99)).toBe(50000);
  });
});

describe("nextStep", () => {
  it("climbs one step on a correct answer", () => {
    expect(nextStep(0, true)).toBe(1);
    expect(nextStep(4, true)).toBe(5);
  });

  it("stays on the top step when correct at the top", () => {
    expect(nextStep(6, true)).toBe(6);
  });

  it("drops three steps on a wrong answer", () => {
    expect(nextStep(6, false)).toBe(3); // 50000 -> 1000
    expect(nextStep(5, false)).toBe(2); // 10000 -> 500
    expect(nextStep(4, false)).toBe(1); // 3000 -> 200
  });

  it("never drops below zero", () => {
    expect(nextStep(3, false)).toBe(0); // 1000 -> 0
    expect(nextStep(1, false)).toBe(0); // 200 -> 0
    expect(nextStep(0, false)).toBe(0);
  });
});

describe("formatEuro", () => {
  it("formats prizes the Portuguese way", () => {
    expect(formatEuro(0)).toBe("0\u00a0€");
    expect(formatEuro(200)).toBe("200\u00a0€");
    expect(formatEuro(1000)).toBe("1000\u00a0€");
    expect(formatEuro(3000)).toBe("3000\u00a0€");
    expect(formatEuro(10000)).toBe("10\u00a0000\u00a0€");
    expect(formatEuro(50000)).toBe("50\u00a0000\u00a0€");
  });
});

describe("gameReducer", () => {
  it("starts in the intro at the bottom of the ladder", () => {
    expect(createGameState(12)).toMatchObject({
      phase: "intro",
      index: 0,
      step: 0,
      answers: [],
      feedback: null,
    });
  });

  it("starts answering after start", () => {
    expect(run(createGameState(12), { type: "start" }).phase).toBe("answering");
  });

  it("ignores actions in the wrong phase", () => {
    const intro = createGameState(12);

    expect(run(intro, right)).toBe(intro);
    expect(run(intro, next)).toBe(intro);

    const answering = run(intro, { type: "start" });
    expect(run(answering, { type: "start" })).toBe(answering);
    expect(run(answering, next)).toBe(answering);

    const feedback = run(answering, right);
    expect(run(feedback, right)).toBe(feedback);
  });

  it("records a correct answer and climbs", () => {
    const state = run(createGameState(12), { type: "start" }, right);

    expect(state.phase).toBe("feedback");
    expect(state.step).toBe(1);
    expect(state.answers).toEqual([true]);
    expect(state.feedback).toEqual({
      selected: 0,
      correct: true,
      correctIndex: 0,
      fromStep: 0,
      toStep: 1,
    });
  });

  it("records a wrong answer and drops", () => {
    const state = run(
      createGameState(12),
      { type: "start" },
      right,
      next,
      right,
      next,
      right,
      next,
      right,
      next,
      wrong,
    );

    // steps: 0 -> 1 -> 2 -> 3 -> 4, then a wrong answer drops 3 -> 1
    expect(state.step).toBe(1);
    expect(state.feedback).toMatchObject({ fromStep: 4, toStep: 1 });
    expect(state.answers).toEqual([true, true, true, true, false]);
  });

  it("treats a timeout (no selection) as given by the caller", () => {
    const timeout: GameAction = {
      type: "answered",
      selected: null,
      correct: false,
      correctIndex: 2,
    };
    const state = run(createGameState(12), { type: "start" }, timeout);

    expect(state.feedback).toMatchObject({ selected: null, correct: false });
    expect(state.step).toBe(0);
  });

  it("moves to the next question and clears the feedback", () => {
    const state = run(createGameState(12), { type: "start" }, right, next);

    expect(state).toMatchObject({
      phase: "answering",
      index: 1,
      feedback: null,
    });
  });

  it("finishes after the last question", () => {
    let state = run(createGameState(3), { type: "start" });

    for (let i = 0; i < 3; i++) {
      state = run(state, right, next);
    }

    expect(state.phase).toBe("finished");
    expect(state.answers).toHaveLength(3);
    expect(state.step).toBe(3);
  });

  it("plays a whole 12-question game", () => {
    // 6 right (0 -> 6, 50000), 1 wrong (-> 3), 5 right (3 -> 6 and stays)
    const answers = [
      ...Array(6).fill(right),
      wrong,
      ...Array(5).fill(right),
    ] as GameAction[];

    let state = run(createGameState(12), { type: "start" });
    for (const answer of answers) {
      state = run(state, answer, next);
    }

    expect(state.phase).toBe("finished");
    expect(state.answers.filter(Boolean)).toHaveLength(11);
    expect(prizeAt(state.step)).toBe(50000);
  });
});
