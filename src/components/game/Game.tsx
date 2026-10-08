"use client";

import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import clsx from "clsx";
import { checkAnswer } from "@/app/jogar/[seed]/actions";
import { Ladder } from "@/components/game/Ladder";
import { ResultScreen } from "@/components/game/ResultScreen";
import { Timer } from "@/components/game/Timer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { SeedChip } from "@/components/ui/SeedChip";
import {
  LADDER,
  SECONDS_PER_QUESTION,
  WRONG_ANSWER_DROP,
  createGameState,
  formatEuro,
  gameReducer,
  prizeAt,
} from "@/lib/game";
import type { ClientQuestion } from "@/lib/questions";

type GameProps = {
  seed: string;
  questions: ClientQuestion[];
};

const DIFFICULTY_LABELS = { 1: "Fácil", 2: "Média", 3: "Difícil" } as const;
const OPTION_LETTERS = ["A", "B", "C", "D"];

export function Game({ seed, questions }: GameProps) {
  const [state, dispatch] = useReducer(
    gameReducer,
    questions.length,
    createGameState,
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const [isChecking, setIsChecking] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<number | null>(null);

  const isCheckingRef = useRef(false);
  const onTimeUpRef = useRef<() => void>(() => {});
  const questionRef = useRef<HTMLFieldSetElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const question = questions[state.index];

  async function submit(choice: number | null) {
    if (state.phase !== "answering" || isCheckingRef.current) return;

    isCheckingRef.current = true;
    setIsChecking(true);
    setCheckFailed(false);
    setPendingChoice(choice);

    try {
      const result = await checkAnswer(seed, state.index, choice);

      if (result.ok) {
        dispatch({
          type: "answered",
          selected: choice,
          correct: result.correct,
          correctIndex: result.correctIndex,
        });
      } else {
        setCheckFailed(true);
      }
    } catch {
      setCheckFailed(true);
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }

  function goToNext() {
    setSelected(null);
    setSecondsLeft(SECONDS_PER_QUESTION);
    setCheckFailed(false);
    dispatch({ type: "next" });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (selected !== null) submit(selected);
  }

  useEffect(() => {
    onTimeUpRef.current = () => submit(null);
  });

  useEffect(() => {
    if (state.phase !== "answering") return;

    const deadline = Date.now() + SECONDS_PER_QUESTION * 1000;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onTimeUpRef.current();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [state.phase, state.index]);

  useEffect(() => {
    if (state.phase === "feedback") {
      feedbackRef.current?.focus();
    } else if (state.phase === "answering" && state.index > 0) {
      questionRef.current?.focus();
    }
  }, [state.phase, state.index]);

  if (state.phase === "intro") {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <h1 className="sr-only">Jogo com a seed {seed}</h1>

        <Card padding="lg">
          <h2 className="text-3xl">Pronto para jogar?</h2>

          <ul role="list" className="mt-6 space-y-2 text-muted">
            <li>{questions.length} perguntas, das mais fáceis às mais difíceis.</li>
            <li>{SECONDS_PER_QUESTION} segundos para responder a cada uma.</li>
            <li>Resposta certa: sobes 1 degrau da escada.</li>
            <li>
              Resposta errada ou tempo esgotado: desces {WRONG_ANSWER_DROP}{" "}
              degraus.
            </li>
            <li>
              Ficas com o prémio do degrau em que terminares, até{" "}
              {formatEuro(LADDER[LADDER.length - 1])}.
            </li>
          </ul>

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-sm text-muted">Seed deste jogo</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <SeedChip className="text-xl">{seed}</SeedChip>
              <CopyButton variant="ghost" getText={() => seed}>
                Copiar seed
              </CopyButton>
            </div>
          </div>

          <Button
            size="lg"
            className="mt-8 w-full shadow-accent-glow"
            onClick={() => dispatch({ type: "start" })}
          >
            Começar
          </Button>
        </Card>
      </div>
    );
  }

  if (state.phase === "finished") {
    return (
      <div className="px-4 py-12 sm:py-16">
        <h1 className="sr-only">Resultado do jogo com a seed {seed}</h1>
        <ResultScreen seed={seed} step={state.step} answers={state.answers} />
      </div>
    );
  }

  const feedback = state.feedback;
  const isLocked = state.phase === "feedback" || isChecking;
  const isLast = state.index + 1 === state.total;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="sr-only">Jogo com a seed {seed}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <Card padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
            <p>
              Pergunta {state.index + 1} de {state.total} ·{" "}
              {DIFFICULTY_LABELS[question.difficulty]}
            </p>
            <SeedChip className="text-sm">{seed}</SeedChip>
          </div>

          {state.phase === "answering" && (
            <div className="mt-6">
              <Timer
                secondsLeft={secondsLeft}
                totalSeconds={SECONDS_PER_QUESTION}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6">
            <fieldset
              ref={questionRef}
              tabIndex={-1}
              disabled={isLocked}
              className="min-w-0"
            >
              <legend className="font-display text-2xl font-bold leading-snug">
                {question.text}
              </legend>

              <div className="mt-6 space-y-3">
                {question.options.map((option, index) => {
                  const isCorrect = feedback?.correctIndex === index;
                  const isWrongChoice =
                    feedback !== null &&
                    feedback.selected === index &&
                    !feedback.correct;

                  return (
                    <label
                      key={index}
                      className={clsx(
                        "flex min-h-14 items-center gap-3 rounded-md border px-4 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
                        isLocked ? "cursor-default" : "cursor-pointer",
                        isCorrect && "border-success bg-success/10",
                        isWrongChoice && "border-danger bg-danger/10",
                        !isCorrect &&
                          !isWrongChoice &&
                          (selected === index && !feedback
                            ? "border-accent bg-surface-raised"
                            : "border-border-strong bg-surface-raised"),
                        !isCorrect && !isWrongChoice && feedback && "opacity-60",
                        !isLocked && "hover:border-accent",
                      )}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={index}
                        checked={selected === index}
                        onChange={() => setSelected(index)}
                        className="size-5 shrink-0 accent-accent"
                      />
                      <span className="font-mono text-muted">
                        {OPTION_LETTERS[index]}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isCorrect && (
                        <span className="text-sm font-medium text-success">
                          ✓ Resposta certa
                        </span>
                      )}
                      {isWrongChoice && (
                        <span className="text-sm font-medium text-danger">
                          ✕ A tua resposta
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {state.phase === "answering" && (
              <div className="mt-6">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={selected === null}
                  isLoading={isChecking}
                >
                  Confirmar resposta
                </Button>
              </div>
            )}
          </form>

          {checkFailed && (
            <div role="alert" className="mt-4 text-danger">
              <p>Não foi possível verificar a resposta.</p>
              <Button
                variant="secondary"
                className="mt-2"
                onClick={() => submit(pendingChoice)}
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {state.phase === "feedback" && feedback && (
            <div
              ref={feedbackRef}
              tabIndex={-1}
              className="mt-6 rounded-md border border-border bg-surface-raised p-4"
            >
              <p className="font-display text-xl font-bold">
                {feedback.correct
                  ? "Certo!"
                  : feedback.selected === null
                    ? "Tempo esgotado."
                    : "Errado."}
              </p>
              <p className="mt-1 text-muted">
                {feedback.correct
                  ? feedback.toStep === feedback.fromStep
                    ? `Ficas no prémio máximo: ${formatEuro(prizeAt(feedback.toStep))}.`
                    : `Subiste para ${formatEuro(prizeAt(feedback.toStep))}.`
                  : feedback.toStep === feedback.fromStep
                    ? `Ficas nos ${formatEuro(prizeAt(feedback.toStep))}.`
                    : `Desceste para ${formatEuro(prizeAt(feedback.toStep))}.`}
              </p>

              <Button size="lg" className="mt-4" onClick={goToNext}>
                {isLast ? "Ver resultado" : "Pergunta seguinte"}
              </Button>
            </div>
          )}
        </Card>

        <Ladder step={state.step} />
      </div>
    </div>
  );
}
