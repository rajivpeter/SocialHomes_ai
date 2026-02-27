/**
 * 5.3.7: Progressive loading — Skeleton screens matching page layout
 * Used with React.lazy() + Suspense boundaries for route-level code splitting.
 */

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface-card border border-border-default rounded-xl p-5 animate-pulse ${className}`}>
      <div className="h-3 w-24 bg-surface-hover rounded mb-3" />
      <div className="h-7 w-16 bg-surface-hover rounded mb-2" />
      <div className="h-2 w-32 bg-surface-hover rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex gap-4 p-3 border-b border-border-default">
        {[120, 80, 100, 60, 80].map((w, i) => (
          <div key={i} className="h-3 bg-surface-hover rounded" style={{ width: w }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-surface-hover rounded-full" />
            <div>
              <div className="h-3 w-28 bg-surface-hover rounded mb-1" />
              <div className="h-2 w-40 bg-surface-hover rounded" />
            </div>
          </div>
          <div className="h-3 w-20 bg-surface-hover rounded self-center" />
          <div className="h-3 w-24 bg-surface-hover rounded self-center" />
          <div className="h-5 w-14 bg-surface-hover rounded-full self-center" />
          <div className="h-3 w-16 bg-surface-hover rounded self-center" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonKpiRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-surface-card border border-border-default rounded-xl p-5 animate-pulse">
      <div className="h-3 w-32 bg-surface-hover rounded mb-4" />
      <div className="h-48 bg-surface-dark rounded-lg flex items-end justify-around px-4 pb-4 gap-2">
        {[40, 60, 75, 50, 85, 65, 55, 70, 45, 80, 60, 50].map((h, i) => (
          <div key={i} className="w-full bg-surface-hover rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <div className="h-6 w-48 bg-surface-hover rounded mb-2" />
        <div className="h-3 w-72 bg-surface-hover rounded" />
      </div>
      {/* KPIs */}
      <SkeletonKpiRow />
      {/* Chart */}
      <SkeletonChart />
      {/* Table */}
      <SkeletonTable />
    </div>
  );
}

export default SkeletonPage;
