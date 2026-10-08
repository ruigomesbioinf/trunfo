import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { generateSeed, parseSeed } from "@/lib/seed";

export const metadata: Metadata = { title: "Jogar · Trunfo" };

type PlayPageProps = {
  searchParams: Promise<{ seed?: string | string[] }>;
};

// Without a seed it starts a new random game; with a seed it starts that
// game; with an invalid seed it explains the problem.
export default async function PlayPage({ searchParams }: PlayPageProps) {
  const { seed } = await searchParams;

  if (seed === undefined) {
    redirect(`/jogar/${generateSeed()}`);
  }

  const value = Array.isArray(seed) ? seed[0] : seed;
  const canonicalSeed = parseSeed(value);

  if (canonicalSeed) {
    redirect(`/jogar/${canonicalSeed}`);
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full max-w-xl flex-1 px-4 py-16"
    >
      <h1 className="text-3xl">Seed inválida</h1>
      <p className="mt-3 text-muted">
        Não conseguimos encontrar o jogo que procuras. Confirma a seed ou joga
        um desafio novo.
      </p>

      <Card padding="lg" className="mt-8">
        <form action="/jogar" method="get" className="space-y-4">
          <Input
            name="seed"
            label="Seed"
            defaultValue={value}
            error="Esta seed não é válida. Tem 7 caracteres, como 7K4M-92Q."
            required
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono uppercase tracking-wider"
          />

          <Button type="submit" className="w-full">
            Jogar com seed
          </Button>
        </form>
      </Card>

      <div className="mt-6">
        <ButtonLink href="/jogar" prefetch={false} variant="secondary">
          Jogar um desafio novo
        </ButtonLink>
      </div>
    </main>
  );
}
