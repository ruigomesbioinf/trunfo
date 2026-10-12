import { describe, expect, it } from "vitest";
import { MAX_TRUNFOS_PER_QUESTION, type Answer } from "./game";
import type { GameMode } from "./modes";
import { createRng } from "./random";
import {
  DIFFICULTIES,
  QUESTIONS_PER_GAME,
  eliminateWithTrunfo,
  questionAfter,
  questionFor,
  toClientQuestion,
  validateQuestions,
  type GameQuestion,
  type Question,
} from "./questions";
import { SEED_ALPHABET } from "./seed";

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "q001",
    question: "Pergunta?",
    correct: "Certa",
    wrong: ["Errada 1", "Errada 2", "Errada 3"],
    difficulty: 1,
    ...overrides,
  };
}

// 15 questions for each difficulty, ids q1-01 ... q3-15.
function makeBank(): Question[] {
  return DIFFICULTIES.flatMap((difficulty) =>
    Array.from({ length: 15 }, (_, i) => {
      const id = `q${difficulty}-${String(i + 1).padStart(2, "0")}`;
      return makeQuestion({
        id,
        question: `Pergunta ${id}?`,
        correct: `Certa ${id}`,
        wrong: [`A ${id}`, `B ${id}`, `C ${id}`],
        difficulty,
      });
    }),
  );
}

// A question already played, with the trunfos played as a help on it.
function correct(trunfosUsed = 0): Answer {
  return { correct: true, trunfosUsed };
}

function incorrect(trunfosUsed = 0): Answer {
  return { correct: false, trunfosUsed };
}

// Plays a whole game without trunfos: `isRight(index)` says whether the player
// answers question number `index` correctly. Returns the questions asked.
function play(
  seed: string,
  bank: readonly Question[],
  isRight: (index: number) => boolean,
  mode: GameMode = "solo",
): GameQuestion[] {
  const answers: Answer[] = [];
  const asked: GameQuestion[] = [];

  for (let index = 0; index < QUESTIONS_PER_GAME; index++) {
    asked.push(questionFor(mode, seed, bank, answers));
    answers.push(isRight(index) ? correct() : incorrect());
  }

  return asked;
}

const allRight = () => true;
const allWrong = () => false;
const alternating = (index: number) => index % 2 === 0;
const mostlyRight = (index: number) => index % 3 !== 0;

// Always the same valid seeds, spread across the seed space.
function someSeeds(count: number): string[] {
  const rng = createRng("seeds for the tests");

  return Array.from({ length: count }, () =>
    Array.from(
      { length: 7 },
      () => SEED_ALPHABET[Math.floor(rng() * SEED_ALPHABET.length)],
    ).join(""),
  );
}

describe("validateQuestions", () => {
  it("accepts a valid question and keeps its fields", () => {
    const question = makeQuestion({ topic: "história" });

    expect(validateQuestions([question])).toEqual([question]);
  });

  it("accepts an empty bank", () => {
    expect(validateQuestions([])).toEqual([]);
  });

  it("rejects something that is not an array", () => {
    expect(() => validateQuestions({})).toThrow(/array/);
  });

  it("rejects entries that are not objects", () => {
    expect(() => validateQuestions(["x"])).toThrow(/must be an object/);
  });

  it("rejects a missing or empty id", () => {
    expect(() => validateQuestions([makeQuestion({ id: "" })])).toThrow(/"id"/);
  });

  it("rejects duplicated ids", () => {
    expect(() =>
      validateQuestions([
        makeQuestion(),
        makeQuestion({ question: "Outra pergunta?" }),
      ]),
    ).toThrow(/used more than once/);
  });

  it("rejects duplicated question texts", () => {
    expect(() =>
      validateQuestions([makeQuestion(), makeQuestion({ id: "q002" })]),
    ).toThrow(/more than once/);
  });

  it("rejects an empty question text", () => {
    expect(() =>
      validateQuestions([makeQuestion({ question: " " })]),
    ).toThrow(/"question"/);
  });

  it("rejects an empty correct answer", () => {
    expect(() => validateQuestions([makeQuestion({ correct: "" })])).toThrow(
      /"correct"/,
    );
  });

  it("rejects anything other than exactly 3 wrong options", () => {
    expect(() =>
      validateQuestions([makeQuestion({ wrong: ["a", "b"] })]),
    ).toThrow(/exactly 3/);
    expect(() =>
      validateQuestions([makeQuestion({ wrong: ["a", "b", "c", "d"] })]),
    ).toThrow(/exactly 3/);
    expect(() =>
      validateQuestions([makeQuestion({ wrong: ["a", "b", ""] })]),
    ).toThrow(/exactly 3/);
  });

  it("rejects options that repeat, ignoring case and spaces", () => {
    expect(() =>
      validateQuestions([makeQuestion({ wrong: ["certa ", "b", "c"] })]),
    ).toThrow(/different/);
    expect(() =>
      validateQuestions([makeQuestion({ wrong: ["b", "B", "c"] })]),
    ).toThrow(/different/);
  });

  it("rejects an invalid difficulty", () => {
    const invalid = { ...makeQuestion(), difficulty: 4 };

    expect(() => validateQuestions([invalid])).toThrow(/"difficulty"/);
  });

  it("rejects difficulty 0, which is not allowed", () => {
    const unrated = { ...makeQuestion(), difficulty: 0 };

    expect(() => validateQuestions([unrated])).toThrow(
      /"difficulty" must be 1, 2 or 3/,
    );
  });

  it("rejects an empty topic", () => {
    expect(() => validateQuestions([makeQuestion({ topic: "" })])).toThrow(
      /"topic"/,
    );
  });

  it("says which question is wrong", () => {
    expect(() =>
      validateQuestions([
        makeQuestion(),
        makeQuestion({ id: "q002", question: "Outra?", correct: "" }),
      ]),
    ).toThrow(/Question #2 \(id q002\)/);
  });
});

describe("questionAfter", () => {
  const bank = makeBank();
  const seed = "7K4M-92Q";

  it("asks an easy question first", () => {
    expect(questionAfter(seed, bank, []).difficulty).toBe(1);
  });

  it("asks the difficulty of the step the player is on", () => {
    // Each correct answer climbs one step: 0, 200, 500, 1000, 3000, 10 000, 50 000.
    const asked = [0, 1, 2, 3, 4, 5, 6].map(
      (climbed) =>
        questionAfter(seed, bank, Array(climbed).fill(correct())).difficulty,
    );

    expect(asked[0]).toBe(1);
    expect(asked[1]).toBe(1);
    expect([1, 2]).toContain(asked[2]);
    expect(asked[3]).toBe(2);
    expect([2, 3]).toContain(asked[4]);
    expect(asked[5]).toBe(3);
    expect(asked[6]).toBe(3);
  });

  it("keeps the difficulty when trunfos cushion a wrong answer", () => {
    // Four correct answers reach 3000 €. A wrong one with trunfos to spare
    // costs trunfos, not steps, so the questions stay at 3000 € level.
    const difficulty = questionAfter(seed, bank, [
      correct(),
      correct(),
      correct(),
      correct(),
      incorrect(),
    ]).difficulty;

    expect([2, 3]).toContain(difficulty);
  });

  it("goes back to easier questions after a wrong answer with no trunfos left", () => {
    // 3 + 3 + 1 trunfos played as a help leave none. Reaching 3000 € and then
    // answering wrong drops three steps to 200 €.
    expect(
      questionAfter(seed, bank, [
        correct(3),
        correct(3),
        correct(1),
        correct(),
        incorrect(),
      ]).difficulty,
    ).toBe(1);
  });

  it("only asks difficulty 1 while the player stays at the bottom", () => {
    expect(play(seed, bank, allWrong).map((q) => q.difficulty)).toEqual(
      Array(QUESTIONS_PER_GAME).fill(1),
    );
  });

  it("never asks difficulty 0, whatever the seed or the answers", () => {
    for (const someSeed of someSeeds(20)) {
      for (const isRight of [allRight, allWrong, alternating, mostlyRight]) {
        const difficulties = play(someSeed, bank, isRight).map(
          (q) => q.difficulty,
        );

        expect(difficulties.every((d) => d >= 1 && d <= 3)).toBe(true);
      }
    }
  });

  it("draws between two difficulties from the seed on 500 € and 3000 €", () => {
    const seeds = someSeeds(60);
    const on500 = seeds.map(
      (s) => questionAfter(s, bank, [correct(), correct()]).difficulty,
    );
    const on3000 = seeds.map(
      (s) => questionAfter(s, bank, Array(4).fill(correct())).difficulty,
    );
    const count = (asked: number[], difficulty: number) =>
      asked.filter((d) => d === difficulty).length;

    // Roughly half each: both turn up often, and nothing else does.
    expect(count(on500, 1) + count(on500, 2)).toBe(seeds.length);
    expect(count(on500, 1)).toBeGreaterThanOrEqual(15);
    expect(count(on500, 2)).toBeGreaterThanOrEqual(15);
    expect(count(on3000, 2) + count(on3000, 3)).toBe(seeds.length);
    expect(count(on3000, 2)).toBeGreaterThanOrEqual(15);
    expect(count(on3000, 3)).toBeGreaterThanOrEqual(15);
  });

  it("builds a game of 12 questions", () => {
    expect(play(seed, bank, allRight)).toHaveLength(QUESTIONS_PER_GAME);
  });

  it("gives the same questions for the same seed and the same answers", () => {
    expect(play(seed, bank, alternating)).toEqual(
      play(seed, bank, alternating),
    );
  });

  it("accepts a seed in a different but equivalent format", () => {
    expect(play("7k4m92q", bank, alternating)).toEqual(
      play(seed, bank, alternating),
    );
  });

  it("gives different questions for a different seed", () => {
    expect(play(seed, bank, allRight)).not.toEqual(
      play("A83F-2KP", bank, allRight),
    );
  });

  it("does not depend on the order of the bank", () => {
    expect(play(seed, [...bank].reverse(), allRight)).toEqual(
      play(seed, bank, allRight),
    );
  });

  it("gives players asked the same difficulty the same question", () => {
    // After question 1 both are asked difficulty 1: one from 0 €, one from 200 €.
    expect(questionAfter(seed, bank, [incorrect()])).toEqual(
      questionAfter(seed, bank, [correct()]),
    );
  });

  it("gives one question per number and difficulty, whatever path led to it", () => {
    // Every combination of 4 answers, so the player may be on any step from 0 € to 3000 €.
    const paths = Array.from({ length: 16 }, (_, n) =>
      [0, 1, 2, 3].map((bit) => ((n >> bit) & 1 ? correct() : incorrect())),
    );

    for (const someSeed of someSeeds(5)) {
      const seen = new Map<number, GameQuestion>();

      for (const answers of paths) {
        const question = questionAfter(someSeed, bank, answers);
        const first = seen.get(question.difficulty);

        if (first) {
          expect(question).toEqual(first);
        } else {
          seen.set(question.difficulty, question);
        }
      }

      expect(seen.size).toBeGreaterThan(1);
    }
  });

  it("does not repeat a question in a game, whatever the path", () => {
    for (const someSeed of someSeeds(20)) {
      for (const isRight of [allRight, allWrong, alternating, mostlyRight]) {
        const ids = play(someSeed, bank, isRight).map((q) => q.id);

        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it("has the correct answer at correctIndex among 4 shuffled options", () => {
    for (const question of play(seed, bank, allRight)) {
      const source = bank.find((q) => q.id === question.id)!;

      expect(question.options).toHaveLength(4);
      expect([...question.options].sort()).toEqual(
        [source.correct, ...source.wrong].sort(),
      );
      expect(question.options[question.correctIndex]).toBe(source.correct);
    }
  });

  it("has one option more than the trunfos that can be played on a question", () => {
    // With that many trunfos only the correct option is left.
    expect(questionAfter(seed, bank, []).options).toHaveLength(
      MAX_TRUNFOS_PER_QUESTION + 1,
    );
  });

  it("rejects trunfos that the player could not have played", () => {
    expect(() =>
      questionAfter(seed, bank, [correct(3), correct(3), correct(3)]),
    ).toThrow(/Cannot play/);
  });

  it("rejects an invalid seed", () => {
    expect(() => questionAfter("nope", bank, [])).toThrow(/Invalid seed/);
  });

  it("rejects asking for a question after the last one", () => {
    expect(() =>
      questionAfter(seed, bank, Array(QUESTIONS_PER_GAME).fill(correct())),
    ).toThrow(/only has 12 questions/);
  });

  it("explains when a difficulty has too few questions, even for the first question", () => {
    const fewMedium = bank.filter(
      (q) => q.difficulty !== 2 || q.id.endsWith("-01"),
    );

    expect(() => questionAfter(seed, fewMedium, [])).toThrow(
      /Not enough questions of difficulty 2: 1 found, 12 needed/,
    );
  });

  it("needs only as many questions of each difficulty as a game has", () => {
    const justEnough = bank.filter(
      (q) => Number(q.id.slice(-2)) <= QUESTIONS_PER_GAME,
    );

    for (const isRight of [allRight, allWrong, alternating, mostlyRight]) {
      expect(play(seed, justEnough, isRight)).toHaveLength(QUESTIONS_PER_GAME);
    }
  });

  it("does not modify the bank", () => {
    const copy = structuredClone(bank);
    play(seed, bank, mostlyRight);

    expect(bank).toEqual(copy);
  });

  // Locks the selection algorithm. If this fails, shared seeds would give
  // different questions: do not update the values unless that is intended.
  it("matches the recorded games for 7K4M-92Q", () => {
    // Every answer right: the draws on 500 € and 3000 € both gave difficulty 2.
    const climbing = play(seed, bank, allRight);

    expect(climbing.map((q) => q.id)).toEqual([
      "q1-09", "q1-14", "q2-06", "q2-07", "q2-12", "q3-12",
      "q3-13", "q3-08", "q3-01", "q3-06", "q3-15", "q3-05",
    ]);
    expect(climbing.map((q) => q.difficulty)).toEqual([
      1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3,
    ]);
    expect(climbing.map((q) => q.correctIndex)).toEqual([
      1, 0, 2, 1, 0, 3, 0, 1, 0, 1, 0, 1,
    ]);

    // Every answer wrong: stuck on the bottom step, so only difficulty 1.
    const falling = play(seed, bank, allWrong);

    expect(falling.map((q) => q.id)).toEqual([
      "q1-09", "q1-14", "q1-15", "q1-02", "q1-01", "q1-13",
      "q1-10", "q1-06", "q1-04", "q1-03", "q1-08", "q1-12",
    ]);
    expect(falling.map((q) => q.correctIndex)).toEqual([
      1, 0, 2, 2, 3, 2, 3, 2, 1, 2, 0, 0,
    ]);
  });
});

describe("questionFor", () => {
  const bank = makeBank();
  const seed = "7K4M-92Q";

  // The answers of a player who got the first `count` questions right.
  const perfect = (count: number): Answer[] =>
    Array.from({ length: count }, () => correct());

  // Several ways of playing `count` questions, from a perfect run to one with
  // wrong answers and trunfos played (never more than the 7 the player has).
  function histories(count: number): Answer[][] {
    return [
      perfect(count),
      Array.from({ length: count }, () => incorrect()),
      Array.from({ length: count }, (_, i) => (i % 2 === 0 ? correct() : incorrect())),
      Array.from({ length: count }, (_, i) => (i % 3 === 0 ? incorrect(1) : correct(1))),
      Array.from({ length: count }, (_, i) => (i === 0 ? correct(3) : i === 1 ? incorrect(3) : incorrect())),
    ];
  }

  it("in solo, follows the player: it is questionAfter", () => {
    const spent = [correct(3), correct(3), correct(1), correct(), incorrect()];

    expect(questionFor("solo", seed, bank, spent)).toEqual(
      questionAfter(seed, bank, spent),
    );
    // No trunfos left to cushion the fall: back to easy questions.
    expect(questionFor("solo", seed, bank, spent).difficulty).toBe(1);
  });

  it("in multiplayer, asks the same question whatever the answers", () => {
    for (const someSeed of someSeeds(20)) {
      for (const count of [0, 1, 2, 4, 5, 8, 11]) {
        const [reference, ...others] = histories(count).map((answers) =>
          questionFor("multiplayer", someSeed, bank, answers),
        );

        for (const question of others) {
          expect(question).toEqual(reference);
        }
      }
    }
  });

  it("in multiplayer, gives every player the same game from start to end", () => {
    const strategies = [allRight, allWrong, alternating, mostlyRight];
    const games = strategies.map((isRight) =>
      play(seed, bank, isRight, "multiplayer"),
    );

    for (const game of games) {
      expect(game).toEqual(games[0]);
    }
    expect(games[0]).toHaveLength(QUESTIONS_PER_GAME);
  });

  it("in multiplayer, follows the ladder of a player who answers everything right", () => {
    const difficulties = play(seed, bank, allWrong, "multiplayer").map(
      (q) => q.difficulty,
    );

    expect(difficulties.slice(0, 2)).toEqual([1, 1]); // 0 € and 200 €
    expect([1, 2]).toContain(difficulties[2]); // 500 €: drawn
    expect(difficulties[3]).toBe(2); // 1000 €
    expect([2, 3]).toContain(difficulties[4]); // 3000 €: drawn
    expect(difficulties.slice(5)).toEqual(Array(7).fill(3)); // 10 000 € and 50 000 €
  });

  it("gives solo and multiplayer the same questions to a player who answers everything right", () => {
    for (const someSeed of someSeeds(20)) {
      expect(play(someSeed, bank, allRight, "multiplayer")).toEqual(
        play(someSeed, bank, allRight, "solo"),
      );
    }
  });

  it("gives a different game in solo and in multiplayer once the player falls behind", () => {
    expect(play(seed, bank, allWrong, "solo")).not.toEqual(
      play(seed, bank, allWrong, "multiplayer"),
    );
  });

  it("does not repeat a question in a multiplayer game", () => {
    for (const someSeed of someSeeds(20)) {
      const ids = play(someSeed, bank, allWrong, "multiplayer").map((q) => q.id);

      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  // Locks the multiplayer sequence. If this fails, shared seeds would give
  // different questions: do not update the values unless that is intended.
  it("matches the recorded multiplayer game for 7K4M-92Q", () => {
    const game = play(seed, bank, allWrong, "multiplayer");

    expect(game.map((q) => q.id)).toEqual([
      "q1-09", "q1-14", "q2-06", "q2-07", "q2-12", "q3-12",
      "q3-13", "q3-08", "q3-01", "q3-06", "q3-15", "q3-05",
    ]);
    expect(game.map((q) => q.correctIndex)).toEqual([
      1, 0, 2, 1, 0, 3, 0, 1, 0, 1, 0, 1,
    ]);
  });

  it("rejects an invalid seed in both modes", () => {
    for (const mode of ["solo", "multiplayer"] as const) {
      expect(() => questionFor(mode, "nope", bank, [])).toThrow(/Invalid seed/);
    }
  });

  it("rejects asking for a question after the last one in both modes", () => {
    for (const mode of ["solo", "multiplayer"] as const) {
      expect(() =>
        questionFor(mode, seed, bank, Array(QUESTIONS_PER_GAME).fill(correct())),
      ).toThrow(/only has 12 questions/);
    }
  });
});

describe.each(["solo", "multiplayer"] as const)("eliminateWithTrunfo (%s)", (mode) => {
  const bank = makeBank();
  const seed = "7K4M-92Q";
  const options = [0, 1, 2, 3];
  const { correctIndex } = questionAfter(seed, bank, []);
  const wrongOptions = options.filter((option) => option !== correctIndex);

  it("eliminates the other option when the pair holds the correct one", () => {
    for (const wrongOption of wrongOptions) {
      expect(
        eliminateWithTrunfo(mode, seed, bank, [], [], [correctIndex, wrongOption]),
      ).toBe(wrongOption);
      expect(
        eliminateWithTrunfo(mode, seed, bank, [], [], [wrongOption, correctIndex]),
      ).toBe(wrongOption);
    }
  });

  it("eliminates one of the two when both are wrong", () => {
    const [a, b, c] = wrongOptions;

    for (const pair of [[a, b], [a, c], [b, c]]) {
      expect(pair).toContain(eliminateWithTrunfo(mode, seed, bank, [], [], pair));
    }
  });

  it("never eliminates the correct option, whatever the seed, pair or options already out", () => {
    for (const someSeed of someSeeds(40)) {
      const question = questionAfter(someSeed, bank, []);
      const wrongOnes = options.filter((o) => o !== question.correctIndex);

      // Nothing eliminated yet, and then each wrong option eliminated before.
      for (const eliminated of [[], ...wrongOnes.map((o) => [o])]) {
        const inPlay = options.filter((o) => !eliminated.includes(o));

        for (const a of inPlay) {
          for (const b of inPlay.filter((o) => o > a)) {
            const result = eliminateWithTrunfo(mode, someSeed, bank, [], eliminated, [
              a,
              b,
            ]);

            expect([a, b]).toContain(result);
            expect(result).not.toBe(question.correctIndex);
          }
        }
      }
    }
  });

  it("leaves only the correct option after three trunfos on the same question", () => {
    for (const someSeed of someSeeds(20)) {
      const question = questionAfter(someSeed, bank, []);
      const eliminated: number[] = [];

      while (eliminated.length < MAX_TRUNFOS_PER_QUESTION) {
        const inPlay = options.filter((o) => !eliminated.includes(o));

        eliminated.push(
          eliminateWithTrunfo(mode, someSeed, bank, [], eliminated, inPlay.slice(0, 2)),
        );
      }

      expect(options.filter((o) => !eliminated.includes(o))).toEqual([
        question.correctIndex,
      ]);
    }
  });

  it("picks at random between two wrong options, fixed by the seed", () => {
    // Across seeds each option goes about half of the time...
    const lowerOnes = someSeeds(60).filter((someSeed) => {
      const question = questionAfter(someSeed, bank, []);
      const [a, b] = options.filter((o) => o !== question.correctIndex);

      return eliminateWithTrunfo(mode, someSeed, bank, [], [], [a, b]) === a;
    }).length;

    expect(lowerOnes).toBeGreaterThanOrEqual(15);
    expect(lowerOnes).toBeLessThanOrEqual(45);

    // ...but asking again, in any order, always gives the same answer.
    const [a, b] = wrongOptions;
    const first = eliminateWithTrunfo(mode, seed, bank, [], [], [a, b]);

    expect(eliminateWithTrunfo(mode, seed, bank, [], [], [a, b])).toBe(first);
    expect(eliminateWithTrunfo(mode, seed, bank, [], [], [b, a])).toBe(first);
  });

  it("rejects a pair that is not two different options still in play", () => {
    const attempt = (eliminated: number[], pair: number[]) => () =>
      eliminateWithTrunfo(mode, seed, bank, [], eliminated, pair);

    expect(attempt([], [1])).toThrow(/two different options/);
    expect(attempt([], [0, 1, 2])).toThrow(/two different options/);
    expect(attempt([], [1, 1])).toThrow(/two different options/);
    expect(attempt([], [1, 4])).toThrow(/two different options/);
    expect(attempt([], [-1, 1])).toThrow(/two different options/);
    expect(attempt([], [0.5, 1])).toThrow(/two different options/);
    expect(attempt([1], [1, 2])).toThrow(/two different options/);
    expect(attempt([0, 1, 2], [2, 3])).toThrow(/two different options/);
  });

  it("rejects eliminated options that are not valid", () => {
    expect(() =>
      eliminateWithTrunfo(mode, seed, bank, [], [1, 1], [2, 3]),
    ).toThrow(/eliminated options/);
    expect(() => eliminateWithTrunfo(mode, seed, bank, [], [7], [2, 3])).toThrow(
      /eliminated options/,
    );
  });

  it("rejects a trunfo when none are left", () => {
    // 3 + 3 + 1 played on the first three questions: all 7 are gone.
    const allSpent = [correct(3), correct(3), correct(1)];

    expect(() => eliminateWithTrunfo(mode, seed, bank, allSpent, [], [0, 1])).toThrow(
      /no trunfos left/,
    );

    // One is left, and it can be played once on this question but not twice.
    const oneLeft = [correct(3), correct(3)];

    expect(
      options.includes(eliminateWithTrunfo(mode, seed, bank, oneLeft, [], [0, 1])),
    ).toBe(true);
    expect(() => eliminateWithTrunfo(mode, seed, bank, oneLeft, [0], [1, 2])).toThrow(
      /no trunfos left/,
    );
  });

  it("rejects an invalid seed", () => {
    expect(() => eliminateWithTrunfo(mode, "nope", bank, [], [], [0, 1])).toThrow(
      /Invalid seed/,
    );
  });
});

describe("toClientQuestion", () => {
  it("removes the answer", () => {
    const question = questionAfter("7K4M-92Q", makeBank(), []);
    const clientQuestion = toClientQuestion(question);

    expect(clientQuestion).not.toHaveProperty("correctIndex");
    expect(clientQuestion).toEqual({
      id: question.id,
      text: question.text,
      difficulty: question.difficulty,
      options: question.options,
    });
  });
});
