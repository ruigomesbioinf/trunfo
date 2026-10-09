import clsx from "clsx";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { SeedChip } from "@/components/ui/SeedChip";
import { formatEuro, prizeAt, type Answer } from "@/lib/game";

type ResultScreenProps = {
  seed: string;
  step: number;
  answers: Answer[];
};

export function ResultScreen({ seed, step, answers }: ResultScreenProps) {
  const correctCount = answers.filter((answer) => answer.correct).length;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card padding="lg" className="text-center">
        <h2 className="text-2xl">Fim de jogo</h2>

        <p className="mt-6 text-sm text-muted">Terminaste com</p>
        <p className="mt-1 font-display text-5xl font-bold text-accent">
          {formatEuro(prizeAt(step))}
        </p>

        <p className="mt-4 text-muted">
          {correctCount} de {answers.length} respostas certas
        </p>

        <ol
          role="list"
          aria-label="Resultado de cada pergunta"
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          {answers.map(({ correct }, index) => (
            <li
              key={index}
              className={clsx(
                "flex size-9 items-center justify-center rounded-md border text-sm font-medium",
                correct
                  ? "border-success text-success"
                  : "border-danger text-danger",
              )}
            >
              <span aria-hidden="true">{correct ? "✓" : "✕"}</span>
              <span className="sr-only">
                Pergunta {index + 1}: {correct ? "certa" : "errada"}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card padding="lg">
        <h3 className="text-lg">Desafia alguém</h3>
        <p className="mt-2 text-muted">
          Quem jogar esta seed recebe as mesmas perguntas, desde que esteja nos
          mesmos degraus.
        </p>

        <p className="mt-4">
          <SeedChip className="text-xl">{seed}</SeedChip>
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CopyButton variant="secondary" getText={() => seed}>
            Copiar seed
          </CopyButton>
          <CopyButton
            variant="secondary"
            getText={() => `${window.location.origin}/jogar/${seed}`}
          >
            Copiar ligação
          </CopyButton>
        </div>
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/jogar" prefetch={false} size="lg">
          Jogar de novo
        </ButtonLink>
        <ButtonLink href="/" variant="secondary" size="lg">
          Início
        </ButtonLink>
      </div>
    </div>
  );
}
