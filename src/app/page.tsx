import { SiteHeader } from "@/components/layout/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";

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
      
      <main id="main-content" tabIndex={-1}>
        <section>
          <div className="mx-auto max-w-3xl px-4 py-20 sm:py-32 text-center">
            <h1 className="sm:text-5xl lg:text-6xl text-balance">
              Quanto vale o teu conhecimento?
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">
              Testa a tua cultura geral, acompanha o teu progresso e desafio quem quiseres com as nossas seeds.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <ButtonLink size="lg" href="/signup" variant="primary" className="shadow-accent-glow">
                Criar conta grátis
              </ButtonLink>

              <ButtonLink size="lg" href="/login" variant="secondary">
                Entrar
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
