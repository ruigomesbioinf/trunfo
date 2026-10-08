import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:px-6">
          <Link 
            href="/"
            className="font-display text-xl font-bold hover:text-accent"
          >
                Trunfo
          </Link>

          <nav
            aria-label="Conta"
            className="flex items-center gap-2"
            >
            <ButtonLink href="/login" variant="ghost">
                Entrar
            </ButtonLink>

            <ButtonLink href="/signup" variant="primary">
                Criar conta
            </ButtonLink>
          </nav>
        </div>
    </header>
  );
}