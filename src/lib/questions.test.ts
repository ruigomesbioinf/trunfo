import { describe, expect, it } from "vitest";
import {
  DIFFICULTIES,
  QUESTIONS_PER_DIFFICULTY,
  QUESTIONS_PER_GAME,
  buildGame,
  toClientQuestion,
  validateQuestions,
  type Question,
} from "./questions";

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

// 10 questions for each difficulty, ids q1-01 ... q3-10.
function makeBank(): Question[] {
  return DIFFICULTIES.flatMap((difficulty) =>
    Array.from({ length: 10 }, (_, i) => {
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

describe("buildGame", () => {
  const bank = makeBank();
  const seed = "7K4M-92Q";

  it("builds 12 questions, 4 of each difficulty, from easy to hard", () => {
    const game = buildGame(seed, bank);

    expect(game).toHaveLength(QUESTIONS_PER_GAME);
    expect(game.map((q) => q.difficulty)).toEqual(
      DIFFICULTIES.flatMap((d) => Array(QUESTIONS_PER_DIFFICULTY).fill(d)),
    );
  });

  it("gives the same game for the same seed", () => {
    expect(buildGame(seed, bank)).toEqual(buildGame(seed, bank));
  });

  it("accepts a seed in a different but equivalent format", () => {
    expect(buildGame("7k4m92q", bank)).toEqual(buildGame(seed, bank));
  });

  it("gives a different game for a different seed", () => {
    expect(buildGame(seed, bank)).not.toEqual(buildGame("A83F-2KP", bank));
  });

  it("does not depend on the order of the bank", () => {
    expect(buildGame(seed, [...bank].reverse())).toEqual(
      buildGame(seed, bank),
    );
  });

  it("does not repeat questions", () => {
    const ids = buildGame(seed, bank).map((q) => q.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has the correct answer at correctIndex among 4 shuffled options", () => {
    for (const question of buildGame(seed, bank)) {
      const source = bank.find((q) => q.id === question.id)!;

      expect(question.options).toHaveLength(4);
      expect([...question.options].sort()).toEqual(
        [source.correct, ...source.wrong].sort(),
      );
      expect(question.options[question.correctIndex]).toBe(source.correct);
    }
  });

  it("rejects an invalid seed", () => {
    expect(() => buildGame("nope", bank)).toThrow(/Invalid seed/);
  });

  it("explains when a difficulty has too few questions", () => {
    const onlyEasy = bank.filter((q) => q.difficulty === 1);

    expect(() => buildGame(seed, onlyEasy)).toThrow(
      /Not enough questions of difficulty 2/,
    );
  });

  it("does not modify the bank", () => {
    const copy = structuredClone(bank);
    buildGame(seed, bank);

    expect(bank).toEqual(copy);
  });

  // Locks the selection algorithm. If this fails, shared seeds would give
  // different games: do not update the values unless that is intended.
  it("matches the recorded game for 7K4M-92Q", () => {
    const game = buildGame(seed, bank);

    expect(game.map((q) => q.id)).toEqual(
      [
        "q1-06", "q1-01", "q1-04", "q1-07",
        "q2-09", "q2-03", "q2-10", "q2-02",
        "q3-06", "q3-10", "q3-01", "q3-02",
      ],
    );
    expect(game.map((q) => q.correctIndex)).toEqual([
      3, 0, 1, 0, 1, 0, 2, 0, 2, 2, 2, 3,
    ]);
  });
});

describe("toClientQuestion", () => {
  it("removes the answer", () => {
    const [question] = buildGame("7K4M-92Q", makeBank());
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
