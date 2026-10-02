import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-(--text-secondary)">404</p>

        <h1 className="mt-4 text-3xl font-semibold text-(--text-primary)">Página no encontrada</h1>

        <p className="mt-3 text-sm text-(--text-secondary)">
          La ruta que intentas visitar no existe en Omega Markets.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2 text-sm text-(--text-primary) transition-colors hover:bg-(--surface)"
        >
          Volver al dashboard
        </Link>
      </div>
    </section>
  )
}
