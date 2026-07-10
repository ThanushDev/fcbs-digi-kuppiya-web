export default function Skeleton({ className = '', variant = 'text' }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${variant === 'circle' ? 'rounded-full' : ''} ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="card p-6">
      <Skeleton className="mb-4 h-14 w-14" variant="circle" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-6 ${j === 0 ? 'w-1/4' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-3">
        <Skeleton className="mb-3 h-4 w-20" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <div className="lg:col-span-2">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
