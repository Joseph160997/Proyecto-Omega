import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-fg-muted">404</p>

        <h1 className="mt-4 text-3xl font-semibold text-fg">Página no encontrada</h1>

        <p className="mt-3 text-sm text-fg-muted">
          La ruta que intentas visitar no existe en Omega Markets.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl border border-line px-4 py-2 text-sm text-fg transition-colors hover:bg-panel"
        >
          Volver al dashboard
        </Link>
      </div>
    </section>
  )
}
