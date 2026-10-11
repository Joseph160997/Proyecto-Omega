interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-card border border-dashed border-line bg-panel p-10 text-center">
      <p className="text-base font-medium text-fg">{title}</p>

      <p className="mt-2 max-w-md text-sm text-fg-muted">{description}</p>
    </div>
  )
}
