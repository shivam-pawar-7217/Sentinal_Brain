"use client";

export function ChartSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0d1117] to-[#161b22] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
              <div className="mt-1.5 h-3 w-32 animate-pulse rounded bg-white/[0.04]" />
            </div>
          </div>
          <div className="flex h-[220px] items-end gap-1 px-2">
            {Array.from({ length: 20 }, (_, j) => (
              <div
                key={j}
                className="flex-1 animate-pulse rounded-t bg-white/[0.04]"
                style={{
                  height: `${20 + Math.sin(j * 0.5) * 30 + Math.random() * 40}%`,
                  animationDelay: `${j * 50}ms`,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LogSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0e14]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0d1117] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/50" />
        </div>
        <div className="ml-2 h-3 w-40 animate-pulse rounded bg-white/[0.06]" />
      </div>
      <div className="space-y-0 p-0">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-white/[0.04] px-3 py-2.5" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="h-3 w-3 animate-pulse rounded bg-white/[0.04]" />
            <div className="h-3 w-28 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-3 w-12 animate-pulse rounded bg-amber-500/10" />
            <div className="h-3 flex-1 animate-pulse rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HealthSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0d1117] to-[#161b22] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-4 w-36 animate-pulse rounded bg-white/[0.06]" />
        </div>
        <div className="h-3 w-40 animate-pulse rounded bg-white/[0.04]" />
      </div>
      <div className="grid gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-3" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white/[0.08]" />
              <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-14 animate-pulse rounded bg-white/[0.04]" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((j) => (
                <div key={j}>
                  <div className="mb-1 h-2.5 w-12 animate-pulse rounded bg-white/[0.04]" />
                  <div className="h-1.5 w-full animate-pulse rounded-full bg-white/[0.04]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActionSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0d1117] to-[#161b22] p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-4 animate-pulse rounded bg-amber-500/20" />
        <div className="h-4 w-48 animate-pulse rounded bg-white/[0.06]" />
      </div>
      <div className="grid gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.01] p-3" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="h-4 w-4 animate-pulse rounded bg-white/[0.06]" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-2.5 w-40 animate-pulse rounded bg-white/[0.04]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function getSkeletonForTool(toolName: string) {
  switch (toolName) {
    case "fetchDBMetrics":
    case "fetchPaymentMetrics":
      return <ChartSkeleton />;
    case "getRecentSlowLogs":
    case "getPaymentLogs":
      return <LogSkeleton />;
    case "getSystemHealth":
      return <HealthSkeleton />;
    case "getRemediationActions":
      return <ActionSkeleton />;
    default:
      return (
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <div className="h-3 w-32 animate-pulse rounded bg-white/[0.06]" />
        </div>
      );
  }
}
