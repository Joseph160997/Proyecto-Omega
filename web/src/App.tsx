function App() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-(--border) bg-(--surface) p-10 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-(--text-secondary)">
          Omega Markets
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-(--text-primary)">
          Terminal financiera simulada
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-(--text-secondary)">
          Base inicial con React, TypeScript, Vite, Tailwind y estructura profesional lista para
          empezar a construir módulos.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
          <div className="rounded-xl border border-(--border) bg-(--bg) p-4">
            <p className="text-xs uppercase text-(--text-secondary)">Datos</p>
            <p className="mt-1 text-sm font-medium text-(--text-primary)">Zod + APIs</p>
          </div>

          <div className="rounded-xl border border-(--border) bg-(--bg) p-4">
            <p className="text-xs uppercase text-(--text-secondary)">Estado</p>
            <p className="mt-1 text-sm font-medium text-(--text-primary)">Query + Zustand</p>
          </div>

          <div className="rounded-xl border border-(--border) bg-(--bg) p-4">
            <p className="text-xs uppercase text-(--text-secondary)">UI</p>
            <p className="mt-1 text-sm font-medium text-(--text-primary)">Tailwind + React</p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
