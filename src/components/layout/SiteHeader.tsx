import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-y-2 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-display text-xl font-bold hover:text-accent"
        >
          Trunfo
        </Link>
      </div>
    </header>
  );
}
