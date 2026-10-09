import { describe, expect, it } from "vitest";
import {
  LADDER,
  MAX_TRUNFOS_PER_QUESTION,
  TRUNFOS_AT_START,
  createGameState,
  difficultyForStep,
  formatEuro,
  gameReducer,
  prizeAt,
  progressAfter,
  resolveAnswer,
  type Answer,
  type GameAction,
  type GameState,
  type Prize,
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

function trunfo(eliminated: number): GameAction {
  return { type: "trunfoPlayed", eliminated };
}

// Questions already played, with the trunfos played as a help on each.
function correct(trunfosUsed = 0): Answer {
  return { correct: true, trunfosUsed };
}

function incorrect(trunfosUsed = 0): Answer {
  return { correct: false, trunfosUsed };
}

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

describe("resolveAnswer", () => {
  it("climbs one step on a correct answer and keeps the trunfos", () => {
    expect(resolveAnswer(0, 7, true)).toEqual({
      step: 1,
      trunfos: 7,
      trunfosLost: 0,
    });
    expect(resolveAnswer(4, 2, true)).toEqual({
      step: 5,
      trunfos: 2,
      trunfosLost: 0,
    });
  });

  it("stays on the top step when correct at the top", () => {
    expect(resolveAnswer(6, 7, true).step).toBe(6);
  });

  it("drops three steps on a wrong answer when there are no trunfos", () => {
    expect(resolveAnswer(6, 0, false)).toEqual({
      step: 3, // 50000 -> 1000
      trunfos: 0,
      trunfosLost: 0,
    });
    expect(resolveAnswer(5, 0, false).step).toBe(2); // 10000 -> 500
    expect(resolveAnswer(4, 0, false).step).toBe(1); // 3000 -> 200
  });

  it("never drops below zero", () => {
    expect(resolveAnswer(3, 0, false).step).toBe(0); // 1000 -> 0
    expect(resolveAnswer(1, 0, false).step).toBe(0); // 200 -> 0
    expect(resolveAnswer(0, 0, false).step).toBe(0);
  });

  it("lets each trunfo, up to three, absorb a step of the fall and spends it", () => {
    // From 50 000 €, holding 0 to 7 trunfos:
    // [trunfos held, step reached, trunfos lost, trunfos left]
    const table = [0, 1, 2, 3, 4, 5, 6, 7].map((held) => {
      const { step, trunfos, trunfosLost } = resolveAnswer(6, held, false);

      return [held, step, trunfosLost, trunfos];
    });

    expect(table).toEqual([
      [0, 3, 0, 0],
      [1, 4, 1, 0], // loses the trunfo and falls 2 steps
      [2, 5, 2, 0],
      [3, 6, 3, 0],
      [4, 6, 3, 1],
      [5, 6, 3, 2], // loses 3 and does not fall
      [6, 6, 3, 3],
      [7, 6, 3, 4],
    ]);
  });

  it("spends trunfos on every step, even with little or nothing to fall", () => {
    // The agreed rule: nothing is spared at the bottom of the ladder.
    expect(resolveAnswer(0, 5, false)).toEqual({
      step: 0,
      trunfos: 2,
      trunfosLost: 3,
    });
    expect(resolveAnswer(1, 5, false)).toEqual({
      step: 1,
      trunfos: 2,
      trunfosLost: 3,
    });
  });

  it("still falls to the floor when the trunfos only cover part of the fall", () => {
    // 200 € with 1 trunfo: it covers 1 of the 3 steps, and the other 2 are
    // more than there is left to fall, so the player ends on 0 €.
    expect(resolveAnswer(1, 1, false)).toEqual({
      step: 0,
      trunfos: 0,
      trunfosLost: 1,
    });
  });
});

describe("progressAfter", () => {
  it("starts on the bottom step with all the trunfos", () => {
    expect(progressAfter([])).toEqual({ step: 0, trunfos: TRUNFOS_AT_START });
  });

  it("climbs on correct answers and stays on the top step", () => {
    expect(progressAfter([correct(), correct(), correct()])).toEqual({
      step: 3,
      trunfos: TRUNFOS_AT_START,
    });
    expect(progressAfter(Array(10).fill(correct())).step).toBe(6);
  });

  it("spends the trunfos played as a help", () => {
    expect(progressAfter([correct(2), correct(1)])).toEqual({
      step: 2,
      trunfos: TRUNFOS_AT_START - 3,
    });
  });

  it("cushions a wrong answer with the trunfos left after playing some", () => {
    // 4 correct answers reach 3000 €. On the next question 2 trunfos are
    // played as a help (5 left) and the wrong answer costs 3 of those.
    expect(
      progressAfter([correct(), correct(), correct(), correct(), incorrect(2)]),
    ).toEqual({ step: 4, trunfos: 2 });
  });

  it("falls once the trunfos run out: 7 cover two falls and part of a third", () => {
    const toThreeThousand = [correct(), correct(), correct(), correct()];

    expect(progressAfter([...toThreeThousand, incorrect()])).toEqual({
      step: 4,
      trunfos: 4,
    });
    expect(
      progressAfter([...toThreeThousand, incorrect(), incorrect()]),
    ).toEqual({ step: 4, trunfos: 1 });
    expect(
      progressAfter([
        ...toThreeThousand,
        incorrect(),
        incorrect(),
        incorrect(),
      ]),
    ).toEqual({ step: 2, trunfos: 0 }); // the last trunfo covers 1 of 3 steps
  });

  it("rejects histories that cannot have happened", () => {
    expect(() => progressAfter([correct(-1)])).toThrow(/Cannot play/);
    expect(() => progressAfter([correct(1.5)])).toThrow(/Cannot play/);
    expect(() =>
      progressAfter([correct(MAX_TRUNFOS_PER_QUESTION + 1)]),
    ).toThrow(/Cannot play/);
    // 3 + 3 + 3 trunfos, with only 7 to start: the third play has just 1 left.
    expect(() =>
      progressAfter([correct(3), correct(3), correct(3)]),
    ).toThrow(/Cannot play 3 trunfos holding 1/);
  });
});

describe("difficultyForStep", () => {
  // Rolls from the bottom and from the top of each half of [0, 1).
  const rolls = [0, 0.25, 0.49, 0.5, 0.75, 0.99];

  function askedOn(prize: Prize): number[] {
    return rolls.map((roll) => difficultyForStep(LADDER.indexOf(prize), roll));
  }

  it("asks difficulty 1 on 0 € and on 200 €", () => {
    expect(askedOn(0)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(askedOn(200)).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it("draws between difficulty 1 and 2 on 500 €", () => {
    expect(askedOn(500)).toEqual([1, 1, 1, 2, 2, 2]);
  });

  it("asks difficulty 2 on 1000 €", () => {
    expect(askedOn(1000)).toEqual([2, 2, 2, 2, 2, 2]);
  });

  it("draws between difficulty 2 and 3 on 3000 €", () => {
    expect(askedOn(3000)).toEqual([2, 2, 2, 3, 3, 3]);
  });

  it("asks difficulty 3 on 10 000 € and on 50 000 €", () => {
    expect(askedOn(10000)).toEqual([3, 3, 3, 3, 3, 3]);
    expect(askedOn(50000)).toEqual([3, 3, 3, 3, 3, 3]);
  });

  it("covers every step of the ladder", () => {
    for (const prize of LADDER) {
      expect(askedOn(prize).every((d) => [1, 2, 3].includes(d))).toBe(true);
    }
  });

  it("gives both difficulties of a draw the same share of the rolls", () => {
    const evenRolls = Array.from({ length: 1000 }, (_, i) => i / 1000);
    const count = (prize: Prize, difficulty: number) =>
      evenRolls.filter(
        (roll) => difficultyForStep(LADDER.indexOf(prize), roll) === difficulty,
      ).length;

    expect([count(500, 1), count(500, 2)]).toEqual([500, 500]);
    expect([count(3000, 2), count(3000, 3)]).toEqual([500, 500]);
  });

  it("treats steps outside the ladder like the nearest step", () => {
    expect(rolls.map((roll) => difficultyForStep(-1, roll))).toEqual(
      askedOn(0),
    );
    expect(rolls.map((roll) => difficultyForStep(99, roll))).toEqual(
      askedOn(50000),
    );
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
  it("starts in the intro at the bottom of the ladder with every trunfo", () => {
    expect(createGameState(12)).toMatchObject({
      phase: "intro",
      index: 0,
      step: 0,
      trunfos: TRUNFOS_AT_START,
      eliminated: [],
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
    expect(run(intro, trunfo(0))).toBe(intro);

    const answering = run(intro, { type: "start" });
    expect(run(answering, { type: "start" })).toBe(answering);
    expect(run(answering, next)).toBe(answering);

    const feedback = run(answering, right);
    expect(run(feedback, right)).toBe(feedback);
    expect(run(feedback, trunfo(0))).toBe(feedback);
  });

  it("records a correct answer and climbs", () => {
    const state = run(createGameState(12), { type: "start" }, right);

    expect(state.phase).toBe("feedback");
    expect(state.step).toBe(1);
    expect(state.trunfos).toBe(TRUNFOS_AT_START);
    expect(state.answers).toEqual([correct()]);
    expect(state.feedback).toEqual({
      selected: 0,
      correct: true,
      correctIndex: 0,
      fromStep: 0,
      toStep: 1,
      trunfosLost: 0,
    });
  });

  // Climbs 0 -> 1 -> 2 -> 3 -> 4 and then answers wrong.
  const climbThenFail = [
    { type: "start" } as const,
    right, next, right, next, right, next, right, next,
    wrong,
  ];

  it("records a wrong answer and drops three steps when there are no trunfos", () => {
    const withoutTrunfos = { ...createGameState(12), trunfos: 0 };
    const state = run(withoutTrunfos, ...climbThenFail);

    expect(state.step).toBe(1); // the wrong answer drops 4 -> 1
    expect(state.feedback).toMatchObject({
      fromStep: 4,
      toStep: 1,
      trunfosLost: 0,
    });
    expect(state.answers).toEqual([
      correct(),
      correct(),
      correct(),
      correct(),
      incorrect(),
    ]);
  });

  it("cushions a wrong answer with the trunfos and spends them", () => {
    const state = run(createGameState(12), ...climbThenFail);

    expect(state.step).toBe(4); // 7 trunfos: 3 are spent and the step is kept
    expect(state.trunfos).toBe(TRUNFOS_AT_START - 3);
    expect(state.feedback).toMatchObject({
      fromStep: 4,
      toStep: 4,
      trunfosLost: 3,
    });
  });

  it("treats a timeout (no selection) like a wrong answer", () => {
    const timeout: GameAction = {
      type: "answered",
      selected: null,
      correct: false,
      correctIndex: 2,
    };
    const state = run(createGameState(12), { type: "start" }, timeout);

    expect(state.feedback).toMatchObject({
      selected: null,
      correct: false,
      trunfosLost: 3,
    });
    expect(state.step).toBe(0);
    expect(state.trunfos).toBe(TRUNFOS_AT_START - 3);
  });

  it("eliminates an option and spends a trunfo for each trunfo played", () => {
    const state = run(
      createGameState(12),
      { type: "start" },
      trunfo(2),
      trunfo(0),
    );

    expect(state.eliminated).toEqual([2, 0]);
    expect(state.trunfos).toBe(TRUNFOS_AT_START - 2);
    expect(state.phase).toBe("answering");
  });

  it("counts the trunfos played on the answer", () => {
    const state = run(
      createGameState(12),
      { type: "start" },
      trunfo(2),
      trunfo(0),
      right,
    );

    expect(state.answers).toEqual([correct(2)]);
    expect(state.trunfos).toBe(TRUNFOS_AT_START - 2);
  });

  it("keeps the eliminated options until the next question", () => {
    const answering = run(createGameState(12), { type: "start" }, trunfo(1));
    const feedback = run(answering, right);

    expect(feedback.eliminated).toEqual([1]);
    expect(run(feedback, next).eliminated).toEqual([]);
  });

  it("ignores a trunfo for an option that is already eliminated", () => {
    const state = run(createGameState(12), { type: "start" }, trunfo(1));

    expect(run(state, trunfo(1))).toBe(state);
  });

  it("ignores a trunfo when there are none left", () => {
    const state = {
      ...run(createGameState(12), { type: "start" }),
      trunfos: 0,
    };

    expect(run(state, trunfo(1))).toBe(state);
  });

  it("allows at most 3 trunfos on the same question", () => {
    const three = run(
      createGameState(12),
      { type: "start" },
      trunfo(0),
      trunfo(1),
      trunfo(2),
    );

    expect(three.eliminated).toHaveLength(MAX_TRUNFOS_PER_QUESTION);
    expect(run(three, trunfo(3))).toBe(three);
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
    // 6 right (0 -> 6, 50000), 1 wrong (7 trunfos: 3 spent, stays), 5 right
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
    expect(state.answers.filter((answer) => answer.correct)).toHaveLength(11);
    expect(prizeAt(state.step)).toBe(50000);
    expect(state.trunfos).toBe(TRUNFOS_AT_START - 3);
  });

  it("always reaches the step and trunfos that progressAfter works out", () => {
    // Per question: the options eliminated by trunfos, and whether it is right.
    const questions: [number[], boolean][] = [
      [[], true],
      [[1], true],
      [[0, 2], false], // 7 - 3 = 4 trunfos held: 3 are spent
      [[], true],
      [[3], true],
      [[], false], // nothing held: a full fall
      [[], true],
      [[], true],
      [[], true],
      [[], false],
      [[], true],
      [[], true],
    ];
    let state = run(createGameState(questions.length), { type: "start" });

    for (const [eliminated, isRight] of questions) {
      state = run(
        state,
        ...eliminated.map(trunfo),
        isRight ? right : wrong,
        next,
      );

      expect({ step: state.step, trunfos: state.trunfos }).toEqual(
        progressAfter(state.answers),
      );
    }

    expect(state.answers).toHaveLength(questions.length);
  });
});
