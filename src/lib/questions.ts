import { createRng, seededShuffle } from "./random";
import { parseSeed } from "./seed";

export type Difficulty = 0 | 1 | 2 | 3;

export const DIFFICULTIES: readonly Difficulty[] = [0, 1, 2, 3];
export const QUESTIONS_PER_DIFFICULTY = 3;
export const QUESTIONS_PER_GAME =
  DIFFICULTIES.length * QUESTIONS_PER_DIFFICULTY;

const WRONG_OPTIONS_PER_QUESTION = 3;

// A question as written in src/data/questions.json.
export type Question = {
  id: string;
  question: string;
  correct: string;
  wrong: string[];
  difficulty: Difficulty;
  topic?: string;
};

// A question as played: options are shuffled and the answer is an index.
// Contains the answer, so it must never be sent to the browser as is.
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

// Throws an Error that says exactly which question is wrong and why.
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

    if (
      difficulty !== 0 &&
      difficulty !== 1 &&
      difficulty !== 2 &&
      difficulty !== 3
    ) {
      return fail('"difficulty" must be 0, 1, 2 or 3.');
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

// Plain comparison on purpose: localeCompare depends on the environment.
function byId(a: Question, b: Question): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// The same seed and the same bank always give the same game.
// The order in which the random numbers are used is part of that contract:
// first the questions of each difficulty (0 = unrated, then easy, medium, hard),
// then the options of each question in game order.
// A difficulty with no questions at all in the bank is skipped and its slots go
// to the first difficulty that has some, so a bank where every question is
// difficulty 0 still makes a full game.
export function buildGame(
  seed: string,
  bank: readonly Question[],
): GameQuestion[] {
  const canonicalSeed = parseSeed(seed);
  if (!canonicalSeed) {
    throw new Error(`Invalid seed: ${seed}`);
  }

  const rng = createRng(canonicalSeed);
  const sorted = [...bank].sort(byId);
  const picked: Question[] = [];

  const pools = DIFFICULTIES.map((difficulty) => ({
    difficulty,
    pool: sorted.filter((q) => q.difficulty === difficulty),
  })).filter(({ pool }) => pool.length > 0);

  const skipped = DIFFICULTIES.length - pools.length;

  pools.forEach(({ difficulty, pool }, position) => {
    const needed =
      QUESTIONS_PER_DIFFICULTY +
      (position === 0 ? skipped * QUESTIONS_PER_DIFFICULTY : 0);

    if (pool.length < needed) {
      throw new Error(
        `Not enough questions of difficulty ${difficulty}: ` +
          `${pool.length} found, ${needed} needed.`,
      );
    }

    picked.push(...seededShuffle(pool, rng).slice(0, needed));
  });

  if (picked.length === 0) {
    throw new Error("The question bank is empty.");
  }

  return picked.map((q) => {
    const options = seededShuffle([q.correct, ...q.wrong], rng);

    return {
      id: q.id,
      text: q.question,
      difficulty: q.difficulty,
      options,
      correctIndex: options.indexOf(q.correct),
    };
  });
}

export function toClientQuestion(question: GameQuestion): ClientQuestion {
  return {
    id: question.id,
    text: question.text,
    difficulty: question.difficulty,
    options: question.options,
  };
}
