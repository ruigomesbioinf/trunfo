"use client";

import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import clsx from "clsx";
import { checkAnswer, playTrunfo } from "@/app/actions";
import { Ladder } from "@/components/game/Ladder";
import { ResultScreen } from "@/components/game/ResultScreen";
import { Timer } from "@/components/game/Timer";
import { Trunfos } from "@/components/game/Trunfos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { SeedChip } from "@/components/ui/SeedChip";
import {
  LADDER,
  SECONDS_PER_QUESTION,
  TRUNFOS_AT_START,
  WRONG_ANSWER_DROP,
  createGameState,
  formatEuro,
  gameReducer,
  prizeAt,
  type Feedback,
} from "@/lib/game";
import type { GameMode } from "@/lib/modes";
import type { ClientQuestion } from "@/lib/questions";
import { randomOrder } from "@/lib/random";

type GameProps = {
  mode: GameMode;
  seed: string;
  total: number;
  firstQuestion: ClientQuestion;
};

const DIFFICULTY_LABELS = {
  1: "Fácil",
  2: "Média",
  3: "Difícil",
} as const;
const OPTION_LETTERS = ["A", "B", "C", "D"];

function trunfosText(count: number): string {
  return count === 1 ? "1 trunfo" : `${count} trunfos`;
}

function describeOutcome({
  correct,
  fromStep,
  toStep,
  trunfosLost,
}: Feedback): string {
  const prize = formatEuro(prizeAt(toStep));
  const stays = toStep === fromStep;

  if (correct) {
    return stays
      ? `Ficas no prémio máximo: ${prize}.`
      : `Subiste para ${prize}.`;
  }

  if (trunfosLost === 0) {
    return stays ? `Ficas nos ${prize}.` : `Desceste para ${prize}.`;
  }

  const spent = `Gastaste ${trunfosText(trunfosLost)}`;

  return stays
    ? `${spent} e ficas nos ${prize}.`
    : `${spent} e desceste para ${prize}.`;
}

export function Game({ mode, seed, total, firstQuestion }: GameProps) {
  const isMultiplayer = mode === "multiplayer";
  const title = isMultiplayer
    ? `Jogo multijogador com a seed ${seed}`
    : "Jogo a solo";
  const resultTitle = isMultiplayer
    ? `Resultado do jogo multijogador com a seed ${seed}`
    : "Resultado do jogo a solo";
  const [state, dispatch] = useReducer(gameReducer, total, createGameState);
  const [questions, setQuestions] = useState<ClientQuestion[]>([firstQuestion]);
  const [orders, setOrders] = useState<number[][]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const [isChecking, setIsChecking] = useState(false);
  const [failure, setFailure] = useState<"answer" | "trunfo" | null>(null);
  const [pendingChoice, setPendingChoice] = useState<number | null>(null);
  const [isChoosingTrunfo, setIsChoosingTrunfo] = useState(false);
  const [pair, setPair] = useState<number[]>([]);

  const isCheckingRef = useRef(false);
  const onTimeUpRef = useRef<() => void>(() => {});
  const remainingMsRef = useRef(SECONDS_PER_QUESTION * 1000);
  const wasChoosingTrunfoRef = useRef(false);
  const questionRef = useRef<HTMLFieldSetElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const question = questions[state.index];

  function start() {
    setOrders([randomOrder(firstQuestion.options.length)]);
    dispatch({ type: "start" });
  }
  async function submit(choice: number | null) {
    if (state.phase !== "answering" || isCheckingRef.current) return;

    isCheckingRef.current = true;
    setIsChecking(true);
    setFailure(null);
    setPendingChoice(choice);

    try {
      const result = await checkAnswer(
        mode,
        seed,
        state.answers,
        state.eliminated.length,
        choice,
      );

      if (result.ok) {
        const { next } = result;

        if (next) {
          const order = randomOrder(next.options.length);

          setQuestions((seen) => [...seen.slice(0, state.index + 1), next]);
          setOrders((seen) => [...seen.slice(0, state.index + 1), order]);
        }

        dispatch({
          type: "answered",
          selected: choice,
          correct: result.correct,
          correctIndex: result.correctIndex,
        });
      } else {
        setFailure("answer");
      }
    } catch {
      setFailure("answer");
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }

  function startTrunfo() {
    setPair([]);
    setFailure(null);
    setIsChoosingTrunfo(true);
  }

  function togglePair(option: number) {
    setPair((current) =>
      current.includes(option)
        ? current.filter((chosen) => chosen !== option)
        : current.length < 2
          ? [...current, option]
          : [current[1], option],
    );
  }

  async function confirmTrunfo() {
    if (
      state.phase !== "answering" ||
      isCheckingRef.current ||
      pair.length !== 2
    ) {
      return;
    }

    isCheckingRef.current = true;
    setIsChecking(true);
    setFailure(null);

    try {
      const result = await playTrunfo(
        mode,
        seed,
        state.answers,
        state.eliminated,
        pair,
      );

      if (result.ok) {
        dispatch({ type: "trunfoPlayed", eliminated: result.eliminated });
        setSelected((current) =>
          current === result.eliminated ? null : current,
        );
        setPair([]);
        setIsChoosingTrunfo(false);
      } else {
        setFailure("trunfo");
      }
    } catch {
      setFailure("trunfo");
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }

  function goToNext() {
    setSelected(null);
    setSecondsLeft(SECONDS_PER_QUESTION);
    remainingMsRef.current = SECONDS_PER_QUESTION * 1000;
    setFailure(null);
    dispatch({ type: "next" });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (isChoosingTrunfo) {
      confirmTrunfo();
    } else if (selected !== null) {
      submit(selected);
    }
  }

  useEffect(() => {
    onTimeUpRef.current = () => submit(null);
  });

  useEffect(() => {
    if (state.phase !== "answering" || isChoosingTrunfo) return;

    const deadline = Date.now() + remainingMsRef.current;

    const interval = setInterval(() => {
      const remaining = Math.max(0, deadline - Date.now());
      setSecondsLeft(Math.ceil(remaining / 1000));

      if (remaining === 0) {
        clearInterval(interval);
        onTimeUpRef.current();
      }
    }, 250);

    return () => {
      clearInterval(interval);
      remainingMsRef.current = Math.max(0, deadline - Date.now());
    };
  }, [state.phase, state.index, isChoosingTrunfo]);

  useEffect(() => {
    if (state.phase === "feedback") {
      feedbackRef.current?.focus();
    } else if (state.phase === "answering" && state.index > 0) {
      questionRef.current?.focus();
    }
  }, [state.phase, state.index]);

  useEffect(() => {
    if (wasChoosingTrunfoRef.current !== isChoosingTrunfo) {
      wasChoosingTrunfoRef.current = isChoosingTrunfo;
      questionRef.current?.focus();
    }
  }, [isChoosingTrunfo]);

  if (state.phase === "intro") {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <h1 className="sr-only">{title}</h1>

        <Card padding="lg">
          <h2 className="text-3xl">Pronto para jogar?</h2>

          <ul role="list" className="mt-6 space-y-2 text-muted">
            <li>
              {isMultiplayer
                ? `${total} perguntas, das mais fáceis às mais difíceis, iguais para todos os jogadores desta seed.`
                : `${total} perguntas. Quanto mais alto o degrau, mais difícil a pergunta.`}
            </li>
            <li>{SECONDS_PER_QUESTION} segundos para responder a cada uma.</li>
            <li>Resposta certa: sobes 1 degrau da escada.</li>
            <li>
              Resposta errada ou tempo esgotado: desces {WRONG_ANSWER_DROP}{" "}
              degraus, mas cada trunfo (até {WRONG_ANSWER_DROP}) amortece 1
              degrau e gasta-se.
            </li>
            <li>
              Tens {TRUNFOS_AT_START} trunfos. Usa um para escolheres duas
              opções em que tens dúvidas: o jogo elimina uma delas, nunca a
              certa. O tempo pára enquanto escolhes.
            </li>
            <li>
              Ficas com o prémio do degrau em que terminares, até{" "}
              {formatEuro(LADDER[LADDER.length - 1])}.
            </li>
          </ul>

          {isMultiplayer && (
            <div className="mt-8 border-t border-border pt-6">
              <p className="text-sm text-muted">
                Seed deste jogo: partilha-a para jogarem as mesmas perguntas.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <SeedChip className="text-xl">{seed}</SeedChip>
                <CopyButton variant="ghost" getText={() => seed}>
                  Copiar seed
                </CopyButton>
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="mt-8 w-full shadow-accent-glow"
            onClick={start}
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
        <h1 className="sr-only">{resultTitle}</h1>
        <ResultScreen
          mode={mode}
          seed={seed}
          step={state.step}
          answers={state.answers}
        />
      </div>
    );
  }

  const feedback = state.feedback;
  const isLocked = state.phase === "feedback" || isChecking;
  const isLast = state.index + 1 === state.total;
  const canPlayTrunfo =
    state.trunfos > 0 && question.options.length - state.eliminated.length > 1;
  const order =
    orders[state.index] ?? question.options.map((_, index) => index);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="sr-only">{title}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <Card padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
            <p>
              Pergunta {state.index + 1} de {state.total} ·{" "}
              {DIFFICULTY_LABELS[question.difficulty]}
            </p>
            {isMultiplayer && <SeedChip className="text-sm">{seed}</SeedChip>}
          </div>

          {state.phase === "answering" && (
            <div className="mt-6">
              <Timer
                secondsLeft={secondsLeft}
                totalSeconds={SECONDS_PER_QUESTION}
                isPaused={isChoosingTrunfo}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6">
            {isChoosingTrunfo && (
              <p
                id="trunfo-hint"
                className="mb-4 rounded-md border border-accent/60 bg-accent/10 p-3 text-sm"
              >
                Trunfo em jogo, o tempo está parado. Escolhe as duas opções em
                que tens dúvidas: o jogo elimina uma delas, nunca a certa.
              </p>
            )}

            <fieldset
              ref={questionRef}
              tabIndex={-1}
              disabled={isLocked}
              aria-describedby={isChoosingTrunfo ? "trunfo-hint" : undefined}
              className="min-w-0"
            >
              <legend className="font-display text-2xl font-bold leading-snug">
                {question.text}
              </legend>

              <div className="mt-6 space-y-3">
                {order.map((index, position) => {
                  const option = question.options[index];
                  const isCorrect = feedback?.correctIndex === index;
                  const isWrongChoice =
                    feedback !== null &&
                    feedback.selected === index &&
                    !feedback.correct;
                  const isEliminated = state.eliminated.includes(index);
                  const isPicked = isChoosingTrunfo
                    ? pair.includes(index)
                    : selected === index && !feedback;

                  return (
                    <label
                      key={index}
                      className={clsx(
                        "flex min-h-14 items-center gap-3 rounded-md border px-4 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
                        isLocked || isEliminated
                          ? "cursor-default"
                          : "cursor-pointer",
                        isCorrect && "border-success bg-success/10",
                        isWrongChoice && "border-danger bg-danger/10",
                        !isCorrect &&
                          !isWrongChoice &&
                          (isPicked
                            ? "border-accent bg-surface-raised"
                            : "border-border-strong bg-surface-raised"),
                        !isCorrect &&
                          !isWrongChoice &&
                          (isEliminated ? "opacity-40" : feedback && "opacity-60"),
                        !isLocked && !isEliminated && "hover:border-accent",
                      )}
                    >
                      <input
                        type={isChoosingTrunfo ? "checkbox" : "radio"}
                        name="answer"
                        value={index}
                        checked={
                          isChoosingTrunfo ? pair.includes(index) : selected === index
                        }
                        onChange={() =>
                          isChoosingTrunfo ? togglePair(index) : setSelected(index)
                        }
                        disabled={isEliminated}
                        className="size-5 shrink-0 accent-accent"
                      />
                      <span className="font-mono text-muted">
                        {OPTION_LETTERS[position]}
                      </span>
                      <span className={clsx("flex-1", isEliminated && "line-through")}>
                        {option}
                      </span>
                      {isEliminated && (
                        <span className="text-sm font-medium text-muted">
                          ✕ Eliminada
                        </span>
                      )}
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

            <p role="status" className="sr-only">
              {state.eliminated.length > 0
                ? `Opções eliminadas pelo trunfo: ${order
                    .flatMap((index, position) =>
                      state.eliminated.includes(index)
                        ? [OPTION_LETTERS[position]]
                        : [],
                    )
                    .join(", ")}.`
                : ""}
            </p>

            {state.phase === "answering" && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {isChoosingTrunfo ? (
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto"
                    disabled={pair.length !== 2}
                    isLoading={isChecking}
                  >
                    Confirmar trunfo
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full sm:w-auto"
                      disabled={selected === null}
                      isLoading={isChecking}
                    >
                      Confirmar resposta
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto"
                      disabled={!canPlayTrunfo || isChecking}
                      onClick={startTrunfo}
                    >
                      Usar trunfo ({state.trunfos})
                    </Button>
                  </>
                )}
              </div>
            )}
          </form>

          {failure && (
            <div role="alert" className="mt-4 text-danger">
              <p>
                {failure === "trunfo"
                  ? "Não foi possível usar o trunfo."
                  : "Não foi possível verificar a resposta."}
              </p>
              <Button
                variant="secondary"
                className="mt-2"
                onClick={() =>
                  failure === "trunfo" ? confirmTrunfo() : submit(pendingChoice)
                }
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
              <p className="mt-1 text-muted">{describeOutcome(feedback)}</p>

              <Button size="lg" className="mt-4" onClick={goToNext}>
                {isLast ? "Ver resultado" : "Pergunta seguinte"}
              </Button>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Ladder step={state.step} />
          <Trunfos count={state.trunfos} total={TRUNFOS_AT_START} />
        </div>
      </div>
    </div>
  );
}
