import { createRng, seededShuffle } from "./random";
import { difficultyForStep, progressAfter, type Answer } from "./game";
import type { GameMode } from "./modes";
import { parseSeed } from "./seed";

export type Difficulty = 1 | 2 | 3;

export const DIFFICULTIES: readonly Difficulty[] = [1, 2, 3];
export const QUESTIONS_PER_GAME = 12;

const WRONG_OPTIONS_PER_QUESTION = 3;

export type Question = {
  id: string;
  question: string;
  correct: string;
  wrong: string[];
  difficulty: Difficulty;
  topic?: string;
};

export type GameQuestion = {
  id: string;
  text: string;
  difficulty: Difficulty;
  options: string[];
  correctIndex: number;
};

export type ClientQuestion = Omit<GameQuestion, "correctIndex">;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalise(text: string): string {
  return text.trim().toLowerCase();
}

export function validateQuestions(raw: unknown): Question[] {
  if (!Array.isArray(raw)) {
    throw new Error("The question bank must be an array.");
  }

  const ids = new Set<string>();
  const texts = new Set<string>();

  return raw.map((entry: unknown, index) => {
    const label = `Question #${index + 1}`;
    const fail = (reason: string): never => {
      const id =
        typeof entry === "object" && entry !== null && "id" in entry
          ? ` (id ${String((entry as { id: unknown }).id)})`
          : "";
      throw new Error(`${label}${id}: ${reason}`);
    };

    if (typeof entry !== "object" || entry === null) {
      return fail("must be an object.");
    }

    const { id, question, correct, wrong, difficulty, topic } =
      entry as Record<string, unknown>;

    if (!isNonEmptyString(id)) return fail('"id" must be a non-empty string.');
    if (ids.has(id)) return fail(`the id "${id}" is used more than once.`);
    ids.add(id);

    if (!isNonEmptyString(question)) {
      return fail('"question" must be a non-empty string.');
    }
    if (texts.has(normalise(question))) {
      return fail("this question text appears more than once.");
    }
    texts.add(normalise(question));

    if (!isNonEmptyString(correct)) {
      return fail('"correct" must be a non-empty string.');
    }

    if (
      !Array.isArray(wrong) ||
      wrong.length !== WRONG_OPTIONS_PER_QUESTION ||
      !wrong.every(isNonEmptyString)
    ) {
      return fail(
        `"wrong" must be a list of exactly ${WRONG_OPTIONS_PER_QUESTION} non-empty strings.`,
      );
    }

    const options = [correct, ...(wrong as string[])].map(normalise);
    if (new Set(options).size !== options.length) {
      return fail('the options must all be different ("correct" and "wrong").');
    }

    if (difficulty !== 1 && difficulty !== 2 && difficulty !== 3) {
      return fail('"difficulty" must be 1, 2 or 3.');
    }

    if (topic !== undefined && !isNonEmptyString(topic)) {
      return fail('"topic", when present, must be a non-empty string.');
    }

    return {
      id,
      question,
      correct,
      wrong: wrong as string[],
      difficulty,
      ...(topic === undefined ? {} : { topic }),
    };
  });
}

function byId(a: Question, b: Question): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function parseSeedOrThrow(seed: string): string {
  const canonicalSeed = parseSeed(seed);

  if (!canonicalSeed) {
    throw new Error(`Invalid seed: ${seed}`);
  }

  return canonicalSeed;
}

function assertEnoughQuestions(bank: readonly Question[]): void {
  for (const difficulty of DIFFICULTIES) {
    const found = bank.filter((q) => q.difficulty === difficulty).length;

    if (found < QUESTIONS_PER_GAME) {
      throw new Error(
        `Not enough questions of difficulty ${difficulty}: ` +
          `${found} found, ${QUESTIONS_PER_GAME} needed.`,
      );
    }
  }
}

function difficultyRolls(seed: string): number[] {
  const rng = createRng(`${seed}/rolls`);

  return Array.from({ length: QUESTIONS_PER_GAME }, () => rng());
}

export function questionAfter(
  seed: string,
  bank: readonly Question[],
  answers: readonly Answer[],
): GameQuestion {
  const canonicalSeed = parseSeedOrThrow(seed);

  const index = answers.length;
  if (index >= QUESTIONS_PER_GAME) {
    throw new Error(`A game only has ${QUESTIONS_PER_GAME} questions.`);
  }

  assertEnoughQuestions(bank);

  const difficulty = difficultyForStep(
    progressAfter(answers).step,
    difficultyRolls(canonicalSeed)[index],
  );

  const pool = bank.filter((q) => q.difficulty === difficulty).sort(byId);
  const picked = seededShuffle(
    pool,
    createRng(`${canonicalSeed}/questions/${difficulty}`),
  )[index];

  const options = seededShuffle(
    [picked.correct, ...picked.wrong],
    createRng(`${canonicalSeed}/options/${picked.id}`),
  );

  return {
    id: picked.id,
    text: picked.question,
    difficulty,
    options,
    correctIndex: options.indexOf(picked.correct),
  };
}

export function questionFor(
  mode: GameMode,
  seed: string,
  bank: readonly Question[],
  answers: readonly Answer[],
): GameQuestion {
  if (mode === "solo") return questionAfter(seed, bank, answers);

  const perfect: Answer = { correct: true, trunfosUsed: 0 };

  return questionAfter(
    seed,
    bank,
    Array.from({ length: answers.length }, () => perfect),
  );
}

export function eliminateWithTrunfo(
  mode: GameMode,
  seed: string,
  bank: readonly Question[],
  answers: readonly Answer[],
  eliminated: readonly number[],
  pair: readonly number[],
): number {
  const canonicalSeed = parseSeedOrThrow(seed);
  const question = questionFor(mode, canonicalSeed, bank, answers);
  const isOption = (option: number) =>
    Number.isInteger(option) && option >= 0 && option < question.options.length;

  if (
    !eliminated.every(isOption) ||
    new Set(eliminated).size !== eliminated.length
  ) {
    throw new Error("The eliminated options are not valid.");
  }

  if (
    pair.length !== 2 ||
    !pair.every(isOption) ||
    pair[0] === pair[1] ||
    pair.some((option) => eliminated.includes(option))
  ) {
    throw new Error("A trunfo needs two different options still in play.");
  }

  if (progressAfter(answers).trunfos - eliminated.length < 1) {
    throw new Error("There are no trunfos left to play.");
  }

  const [first, second] = [...pair].sort((a, b) => a - b);

  if (first === question.correctIndex) return second;
  if (second === question.correctIndex) return first;

  const situation = [...eliminated].sort((a, b) => a - b).join("");
  const roll = createRng(
    `${canonicalSeed}/trunfo/${question.id}/${situation}/${first}${second}`,
  )();

  return roll < 0.5 ? first : second;
}

export function toClientQuestion(question: GameQuestion): ClientQuestion {
  return {
    id: question.id,
    text: question.text,
    difficulty: question.difficulty,
    options: question.options,
  };
}
