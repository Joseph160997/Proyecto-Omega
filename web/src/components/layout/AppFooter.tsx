export function AppFooter() {
  return (
    <footer className="border-t border-line bg-sidebar px-4 py-4 text-xs text-fg-muted md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <p>Omega Markets · Simulación educativa: no usa dinero real y no es asesoría financiera.</p>

        <p>
          Datos de{' '}
          <a
            href="https://www.coingecko.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CoinGecko (se abre en una pestaña nueva)"
            className="font-medium text-accent hover:underline"
          >
            CoinGecko
          </a>
        </p>
      </div>
    </footer>
  )
}
