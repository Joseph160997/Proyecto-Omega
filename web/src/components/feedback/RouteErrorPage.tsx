import { Link, useRouteError } from 'react-router-dom'

import { Button } from '@/components/ui/Button'

/** Pantalla para cuando una página falla al dibujarse. Evita la pantalla en blanco. */
export function RouteErrorPage() {
  const error = useRouteError()

  // El detalle técnico solo se muestra en desarrollo: en producción no se expone al usuario.
  const detail = import.meta.env.DEV && error instanceof Error ? error.message : null

  return (
    <section role="alert" className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-fg-muted">Error</p>

        <h1 className="mt-4 text-3xl font-semibold text-fg">Algo salió mal</h1>

        <p className="mt-3 text-sm text-fg-muted">
          Ocurrió un error inesperado al mostrar esta página. Puedes volver al inicio o recargarla.
        </p>

        {detail ? (
          <details className="mt-4 text-left text-xs text-fg-muted">
            <summary className="cursor-pointer">Detalle técnico (solo en desarrollo)</summary>
            <pre className="mt-2 overflow-x-auto rounded-xl border border-line bg-panel p-3">
              {detail}
            </pre>
          </details>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-line px-4 py-2 text-sm text-fg transition-colors hover:bg-panel"
          >
            Volver al inicio
          </Link>

          <Button variant="primary" onClick={() => window.location.reload()}>
            Recargar la página
          </Button>
        </div>
      </div>
    </section>
  )
}
