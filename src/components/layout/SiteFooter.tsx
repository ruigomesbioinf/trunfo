export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted sm:px-6">
        © {new Date().getFullYear()} Trunfo. Todos os direitos reservados.
      </div>
    </footer>
  );
}
