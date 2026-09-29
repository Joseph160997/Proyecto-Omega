interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-(--border) bg-(--surface) p-10 text-center">
      <p className="text-base font-medium text-(--text-primary)">
        {title}
      </p>

      <p className="mt-2 max-w-md text-sm text-(--text-secondary)">
        {description}
      </p>
    </div>
  )
}