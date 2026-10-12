import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MODE_PATHS } from "@/lib/modes";
import { generateSeed } from "@/lib/seed";

export const metadata: Metadata = { title: "Solo · Trunfo" };

// Every visit starts a new game, so this must run on each request and never
// at build time (that would fix one seed for everybody).
export const dynamic = "force-dynamic";

export default function SoloPage() {
  redirect(`${MODE_PATHS.solo}/${generateSeed()}`);
}
