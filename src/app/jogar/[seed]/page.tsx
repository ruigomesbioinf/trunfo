import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Game } from "@/components/game/Game";
import { Card } from "@/components/ui/Card";
import { questionBank } from "@/lib/question-bank";
import {
  QUESTIONS_PER_GAME,
  questionAfter,
  toClientQuestion,
} from "@/lib/questions";
import { parseSeed } from "@/lib/seed";

type GamePageProps = {
  params: Promise<{ seed: string }>;
};

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { seed } = await params;
  const canonicalSeed = parseSeed(seed);

  return { title: canonicalSeed ? `Jogo ${canonicalSeed} · Trunfo` : "Trunfo" };
}

export default async function GamePage({ params }: GamePageProps) {
  const { seed } = await params;
  const canonicalSeed = parseSeed(seed);

  if (!canonicalSeed) notFound();
  if (canonicalSeed !== seed) redirect(`/jogar/${canonicalSeed}`);

  // Only the first question is known up front: the next ones depend on the
  // step the player reaches, so each answer check brings the following one.
  let firstQuestion;

  try {
    firstQuestion = toClientQuestion(
      questionAfter(canonicalSeed, questionBank, []),
    );
  } catch (error) {
    console.error(error);

    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-xl flex-1 px-4 py-16"
      >
        <Card padding="lg">
          <h1 className="text-2xl">O jogo ainda não está disponível</h1>
          <p className="mt-3 text-muted">
            Ainda não há perguntas suficientes para montar um jogo. Volta mais
            tarde.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex-1">
      <Game
        key={canonicalSeed}
        seed={canonicalSeed}
        total={QUESTIONS_PER_GAME}
        firstQuestion={firstQuestion}
      />
    </main>
  );
}
