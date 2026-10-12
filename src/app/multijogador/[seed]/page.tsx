import type { Metadata } from "next";
import { GamePage } from "@/components/game/GamePage";
import { parseSeed } from "@/lib/seed";

type MultiplayerGamePageProps = {
  params: Promise<{ seed: string }>;
};

export async function generateMetadata({
  params,
}: MultiplayerGamePageProps): Promise<Metadata> {
  const { seed } = await params;
  const canonicalSeed = parseSeed(seed);

  return {
    title: canonicalSeed
      ? `Multijogador ${canonicalSeed} · Trunfo`
      : "Multijogador · Trunfo",
  };
}

export default async function MultiplayerGamePage({
  params,
}: MultiplayerGamePageProps) {
  const { seed } = await params;

  return <GamePage mode="multiplayer" seed={seed} />;
}
