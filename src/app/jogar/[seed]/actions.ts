"use server";

import { questionBank } from "@/lib/question-bank";
import { QUESTIONS_PER_GAME, buildGame } from "@/lib/questions";
import { parseSeed } from "@/lib/seed";

export type AnswerCheck =
  | { ok: true; correct: boolean; correctIndex: number }
  | { ok: false };

// `selected` is null when the time ran out. Everything here is untrusted
// input from the browser, so it is validated before use.
export async function checkAnswer(
  seed: string,
  questionIndex: number,
  selected: number | null,
): Promise<AnswerCheck> {
  const canonicalSeed = parseSeed(seed);

  if (
    !canonicalSeed ||
    !Number.isInteger(questionIndex) ||
    questionIndex < 0 ||
    questionIndex >= QUESTIONS_PER_GAME
  ) {
    return { ok: false };
  }

  try {
    const question = buildGame(canonicalSeed, questionBank)[questionIndex];

    if (
      selected !== null &&
      (!Number.isInteger(selected) ||
        selected < 0 ||
        selected >= question.options.length)
    ) {
      return { ok: false };
    }

    return {
      ok: true,
      correct: selected === question.correctIndex,
      correctIndex: question.correctIndex,
    };
  } catch {
    return { ok: false };
  }
}
