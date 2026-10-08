import { SiteHeader } from "@/components/layout/SiteHeader";

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
        <h1>Welcome to the Home Page</h1>
      </main>
    </>
  );
}