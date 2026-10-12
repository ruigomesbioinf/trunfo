import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MODE_PATHS } from "@/lib/modes";
import { generateSeed } from "@/lib/seed";

export const metadata: Metadata = { title: "Solo · Trunfo" };

export const dynamic = "force-dynamic";

export default function SoloPage() {
  redirect(`${MODE_PATHS.solo}/${generateSeed()}`);
}
