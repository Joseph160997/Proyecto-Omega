import { cx } from '@/lib/cx'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cx('rounded bg-raised motion-safe:animate-pulse', className)}
    />
  )
}
