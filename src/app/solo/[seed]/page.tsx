import type { Metadata } from "next";
import { GamePage } from "@/components/game/GamePage";

type SoloGamePageProps = {
  params: Promise<{ seed: string }>;
};

export const metadata: Metadata = { title: "Solo · Trunfo" };

export default async function SoloGamePage({ params }: SoloGamePageProps) {
  const { seed } = await params;

  return <GamePage mode="solo" seed={seed} />;
}
