import { createRng, seededShuffle } from "./random";
import { difficultyForStep, progressAfter, type Answer } from "./game";
import { parseSeed } from "./seed";

export type Difficulty = 1 | 2 | 3;

export const DIFFICULTIES: readonly Difficulty[] = [1, 2, 3];
export const QUESTIONS_PER_GAME = 12;

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

// Plain comparison on purpose: localeCompare depends on the environment.
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

// Which difficulty comes up depends on how the player is doing, so any
// difficulty can be needed for any question of a game. Each one must be able
// to fill a whole game on its own.
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

// One roll in [0, 1) per question number. It settles the draw between two
// difficulties on the steps of the ladder that have two.
function difficultyRolls(seed: string): number[] {
  const rng = createRng(`${seed}/rolls`);

  return Array.from({ length: QUESTIONS_PER_GAME }, () => rng());
}

// The question that follows these answers: `answers` holds, for every question
// already played, whether it was answered correctly and how many trunfos were
// played on it. So the first question is questionAfter(seed, bank, []), and
// the current one is questionAfter(seed, bank, answersSoFar).
//
// A game is not a fixed list of questions: the difficulty of each one depends
// on the step the player is on (see difficultyForStep), and that depends on how
// they answered and on the trunfos that cushioned their falls. It is still a
// pure function of the seed, the bank and the answers, and the random numbers
// come from separate streams, named below. They are part of the contract:
// changing a name changes the questions of every seed that has already been
// shared.
// - `rolls`: one roll per question number, for the steps with two difficulties.
// - `questions/<difficulty>`: a shuffle of that difficulty. Question number n
//   is the nth of that shuffle, so no question is ever repeated in a game, and
//   players asked the same difficulty at the same number get the same question.
// - `options/<id>`: the order of the options of that question.
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

// The option a trunfo eliminates on the question that follows `answers`.
// `eliminated` are the options already eliminated on it, and `pair` the two the
// player chose because they are in doubt between them. One of the two goes,
// and never the correct one: if the pair holds the correct option, the other
// one is eliminated; if both are wrong, one of them is picked at random.
// That "random" is fixed by the seed and the situation, so the same request
// always gets the same answer and asking again cannot change it. The player is
// never told which option is the correct one. Throws if the request is not
// possible: options that do not exist or are already eliminated, or no trunfo
// left to play.
export function eliminateWithTrunfo(
  seed: string,
  bank: readonly Question[],
  answers: readonly Answer[],
  eliminated: readonly number[],
  pair: readonly number[],
): number {
  const canonicalSeed = parseSeedOrThrow(seed);
  const question = questionAfter(canonicalSeed, bank, answers);
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
