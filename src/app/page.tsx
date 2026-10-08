import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function HomePage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:font-medium focus:text-accent-foreground"
      >
        Saltar para o conteúdo
      </a>

      <SiteHeader />

      <main id="main-content" tabIndex={-1} className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 size-96 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:py-32">
            <h1 className="text-balance sm:text-5xl lg:text-6xl">
              Quanto vale o teu conhecimento?
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">
              Testa a tua cultura geral e desafia quem quiseres com uma seed.
            </p>

            <div className="mt-10">
              <ButtonLink
                size="lg"
                href="/jogar"
                variant="primary"
                className="shadow-accent-glow"
              >
                Jogar
              </ButtonLink>
            </div>

            <Card padding="md" className="mx-auto mt-10 max-w-md text-left">
              <form action="/jogar" method="get" className="space-y-4">
                <Input
                  name="seed"
                  label="Seed"
                  hint="Introduz uma seed para jogar o mesmo desafio que outra pessoa."
                  placeholder="7K4M-92Q"
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="font-mono uppercase tracking-wider"
                />

                <Button type="submit" variant="secondary" className="w-full">
                  Jogar com seed
                </Button>
              </form>
            </Card>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
