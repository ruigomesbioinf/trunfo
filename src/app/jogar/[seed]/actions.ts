"use server";

import { questionBank } from "@/lib/question-bank";
import { progressAfter, type Answer } from "@/lib/game";
import {
  QUESTIONS_PER_GAME,
  eliminateWithTrunfo,
  questionAfter,
  toClientQuestion,
  type ClientQuestion,
} from "@/lib/questions";
import { parseSeed } from "@/lib/seed";

// `next` is the question that follows this one, or null after the last.
export type AnswerCheck =
  | {
      ok: true;
      correct: boolean;
      correctIndex: number;
      next: ClientQuestion | null;
    }
  | { ok: false };

// `eliminated` is the option the trunfo took out.
export type TrunfoCheck = { ok: true; eliminated: number } | { ok: false };

function isAnswer(value: unknown): value is Answer {
  if (typeof value !== "object" || value === null) return false;

  const { correct, trunfosUsed } = value as Record<string, unknown>;

  return (
    typeof correct === "boolean" &&
    typeof trunfosUsed === "number" &&
    Number.isInteger(trunfosUsed)
  );
}

// The questions already played: there is always at least one left to answer.
function isAnswerList(value: unknown): value is Answer[] {
  return (
    Array.isArray(value) &&
    value.length < QUESTIONS_PER_GAME &&
    value.every(isAnswer)
  );
}

function isIntegerList(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => Number.isInteger(item));
}

// `answers` says, for every question already played, whether it was answered
// correctly and how many trunfos were played on it: from it the server works
// out the step of the ladder, and so the question being answered. `trunfosUsed`
// is the number played on the question being answered, and `selected` is null
// when the time ran out. Everything here is untrusted input from the browser,
// so it is validated before use.
export async function checkAnswer(
  seed: string,
  answers: Answer[],
  trunfosUsed: number,
  selected: number | null,
): Promise<AnswerCheck> {
  const canonicalSeed = parseSeed(seed);

  if (
    !canonicalSeed ||
    !isAnswerList(answers) ||
    !Number.isInteger(trunfosUsed)
  ) {
    return { ok: false };
  }

  try {
    const question = questionAfter(canonicalSeed, questionBank, answers);

    if (
      selected !== null &&
      (!Number.isInteger(selected) ||
        selected < 0 ||
        selected >= question.options.length)
    ) {
      return { ok: false };
    }

    const correct = selected === question.correctIndex;
    const played = [...answers, { correct, trunfosUsed }];

    // Throws if the player played more trunfos than they had.
    progressAfter(played);

    return {
      ok: true,
      correct,
      correctIndex: question.correctIndex,
      next:
        played.length < QUESTIONS_PER_GAME
          ? toClientQuestion(questionAfter(canonicalSeed, questionBank, played))
          : null,
    };
  } catch {
    return { ok: false };
  }
}

// Plays a trunfo on the question being answered: `eliminated` are the options
// already out and `pair` the two the player is in doubt between. The server
// takes one of the two out and never says which option is the correct one.
export async function playTrunfo(
  seed: string,
  answers: Answer[],
  eliminated: number[],
  pair: number[],
): Promise<TrunfoCheck> {
  const canonicalSeed = parseSeed(seed);

  if (
    !canonicalSeed ||
    !isAnswerList(answers) ||
    !isIntegerList(eliminated) ||
    !isIntegerList(pair)
  ) {
    return { ok: false };
  }

  try {
    return {
      ok: true,
      eliminated: eliminateWithTrunfo(
        canonicalSeed,
        questionBank,
        answers,
        eliminated,
        pair,
      ),
    };
  } catch {
    return { ok: false };
  }
}
