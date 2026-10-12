import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { NewGameLink } from "@/components/game/NewGameLink";
import { MODE_PATHS } from "@/lib/modes";

export default function HomePage() {
  return (
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
            Testa a tua cultura geral a solo ou desafia quem quiseres com uma
            seed.
          </p>

          <div className="mt-10 grid gap-6 text-left sm:grid-cols-2">
            <Card padding="lg" className="flex flex-col">
              <h2>A solo</h2>
              <p className="mt-2 flex-1 text-muted">
                A dificuldade das perguntas segue o degrau em que estás: se
                caíres, voltam as mais fáceis.
              </p>

              <NewGameLink
                mode="solo"
                size="lg"
                variant="primary"
                className="mt-6 shadow-accent-glow"
              >
                Jogar a solo
              </NewGameLink>
            </Card>

            <Card padding="lg" className="flex flex-col">
              <h2>Multijogador</h2>
              <p className="mt-2 text-muted">
                Todos os jogadores de uma seed recebem exatamente as mesmas
                perguntas. Cria um jogo e partilha a seed, ou entra com a de
                outra pessoa.
              </p>

              <NewGameLink
                mode="multiplayer"
                size="lg"
                variant="secondary"
                className="mt-6"
              >
                Criar jogo
              </NewGameLink>

              <form
                action={MODE_PATHS.multiplayer}
                method="get"
                className="mt-6 space-y-4 border-t border-border pt-6"
              >
                <Input
                  name="seed"
                  label="Seed"
                  hint="Introduz a seed de outra pessoa para jogarem as mesmas perguntas."
                  placeholder="7K4M-92Q"
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="font-mono uppercase tracking-wider"
                />

                <Button type="submit" variant="secondary" className="w-full">
                  Entrar com seed
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
