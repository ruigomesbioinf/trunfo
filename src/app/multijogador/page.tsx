import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { NewGameLink } from "@/components/game/NewGameLink";
import { MODE_PATHS } from "@/lib/modes";
import { generateSeed, parseSeed } from "@/lib/seed";

export const metadata: Metadata = { title: "Multijogador · Trunfo" };

type MultiplayerPageProps = {
  searchParams: Promise<{ seed?: string | string[] }>;
};

export default async function MultiplayerPage({
  searchParams,
}: MultiplayerPageProps) {
  const { seed } = await searchParams;

  if (seed === undefined) {
    redirect(`${MODE_PATHS.multiplayer}/${generateSeed()}`);
  }

  const value = Array.isArray(seed) ? seed[0] : seed;
  const canonicalSeed = parseSeed(value);

  if (canonicalSeed) {
    redirect(`${MODE_PATHS.multiplayer}/${canonicalSeed}`);
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full max-w-xl flex-1 px-4 py-16"
    >
      <h1 className="text-3xl">Seed inválida</h1>
      <p className="mt-3 text-muted">
        Não conseguimos encontrar o jogo que procuras. Confirma a seed ou cria
        um jogo novo.
      </p>

      <Card padding="lg" className="mt-8">
        <form
          action={MODE_PATHS.multiplayer}
          method="get"
          className="space-y-4"
        >
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
            Entrar com seed
          </Button>
        </form>
      </Card>

      <div className="mt-6">
        <NewGameLink mode="multiplayer" variant="secondary">
          Criar um jogo novo
        </NewGameLink>
      </div>
    </main>
  );
}
