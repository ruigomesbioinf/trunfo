"use server";

import { progressAfter, type Answer } from "@/lib/game";
import { isGameMode, type GameMode } from "@/lib/modes";
import { questionBank } from "@/lib/question-bank";
import {
  QUESTIONS_PER_GAME,
  eliminateWithTrunfo,
  questionFor,
  toClientQuestion,
  type ClientQuestion,
} from "@/lib/questions";
import { parseSeed } from "@/lib/seed";

export type AnswerCheck =
  | {
      ok: true;
      correct: boolean;
      correctIndex: number;
      next: ClientQuestion | null;
    }
  | { ok: false };

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

export async function checkAnswer(
  mode: GameMode,
  seed: string,
  answers: Answer[],
  trunfosUsed: number,
  selected: number | null,
): Promise<AnswerCheck> {
  const canonicalSeed = parseSeed(seed);

  if (
    !isGameMode(mode) ||
    !canonicalSeed ||
    !isAnswerList(answers) ||
    !Number.isInteger(trunfosUsed)
  ) {
    return { ok: false };
  }

  try {
    const question = questionFor(mode, canonicalSeed, questionBank, answers);

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

    progressAfter(played);

    return {
      ok: true,
      correct,
      correctIndex: question.correctIndex,
      next:
        played.length < QUESTIONS_PER_GAME
          ? toClientQuestion(
              questionFor(mode, canonicalSeed, questionBank, played),
            )
          : null,
    };
  } catch {
    return { ok: false };
  }
}

export async function playTrunfo(
  mode: GameMode,
  seed: string,
  answers: Answer[],
  eliminated: number[],
  pair: number[],
): Promise<TrunfoCheck> {
  const canonicalSeed = parseSeed(seed);

  if (
    !isGameMode(mode) ||
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
        mode,
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
