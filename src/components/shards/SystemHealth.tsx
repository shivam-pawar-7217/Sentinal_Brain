"use client";

import { useState, useEffect } from "react";
import type { SystemHealthData } from "@/lib/mock-data";
import { Activity, Cpu, HardDrive, Gauge } from "lucide-react";

interface SystemHealthProps {
  services: SystemHealthData[];
}

const STATUS_CONFIG = {
  healthy: { dot: "bg-emerald-500", bg: "bg-emerald-500/5 border-emerald-500/10", text: "text-emerald-400" },
  degraded: { dot: "bg-amber-500", bg: "bg-amber-500/5 border-amber-500/10", text: "text-amber-400" },
  critical: { dot: "bg-red-500 animate-pulse", bg: "bg-red-500/5 border-red-500/10", text: "text-red-400" },
};

function MiniBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// Jitter a value by ±delta (clamped to min/max)
function jitter(base: number, delta: number, min: number = 0, max: number = 100): number {
  const jittered = base + (Math.random() * 2 - 1) * delta;
  return Math.round(Math.min(max, Math.max(min, jittered)) * 10) / 10;
}

export function SystemHealth({ services: initialServices }: SystemHealthProps) {
  const [services, setServices] = useState(initialServices);

  // Real-time pulse: jitter CPU, memory, latency, error_rate every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setServices((prev) =>
        prev.map((svc) => ({
          ...svc,
          cpu: jitter(svc.cpu, 3, 5, 99),
          memory: jitter(svc.memory, 2, 10, 99),
          latency_p99: Math.round(jitter(svc.latency_p99, svc.latency_p99 * 0.05, 1, 30000)),
          error_rate: Math.round(jitter(svc.error_rate, svc.error_rate * 0.1, 0, 100) * 100) / 100,
        }))
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const critical = services.filter((s) => s.status === "critical").length;
  const degraded = services.filter((s) => s.status === "degraded").length;
  const healthy = services.filter((s) => s.status === "healthy").length;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0d1117] to-[#161b22] p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">System Health Overview</h3>
          <span className="ml-1 flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
            LIVE
          </span>
        </div>
        <div className="flex gap-3 text-[10px] font-medium">
          <span className="text-emerald-400">{healthy} healthy</span>
          <span className="text-amber-400">{degraded} degraded</span>
          <span className="text-red-400">{critical} critical</span>
        </div>
      </div>
      <div className="grid gap-2">
        {services.map((svc) => {
          const cfg = STATUS_CONFIG[svc.status];
          const cpuColor = svc.cpu > 85 ? "#ef4444" : svc.cpu > 60 ? "#f59e0b" : "#10b981";
          const memColor = svc.memory > 85 ? "#ef4444" : svc.memory > 60 ? "#f59e0b" : "#10b981";
          return (
            <div key={svc.service} className={`rounded-lg border p-3 transition-colors duration-700 ${cfg.bg}`}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-semibold text-slate-200">{svc.service}</span>
                  <span className={`text-[10px] font-medium uppercase ${cfg.text}`}>{svc.status}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-600">
                  <span>{svc.region}</span>
                  <span>↑ {svc.uptime}</span>
                  <span>deployed {svc.last_deploy}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-1 text-[10px] text-slate-500"><Cpu className="h-2.5 w-2.5" /> CPU <span className="tabular-nums">{svc.cpu}%</span></div>
                  <MiniBar value={svc.cpu} color={cpuColor} />
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1 text-[10px] text-slate-500"><HardDrive className="h-2.5 w-2.5" /> MEM <span className="tabular-nums">{svc.memory}%</span></div>
                  <MiniBar value={svc.memory} color={memColor} />
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1 text-[10px] text-slate-500"><Gauge className="h-2.5 w-2.5" /> P99</div>
                  <span className="font-mono text-[11px] tabular-nums text-slate-300">{svc.latency_p99 >= 1000 ? `${(svc.latency_p99 / 1000).toFixed(1)}s` : `${svc.latency_p99}ms`}</span>
                </div>
                <div>
                  <div className="mb-1 text-[10px] text-slate-500">Err Rate</div>
                  <span className={`font-mono text-[11px] tabular-nums ${svc.error_rate > 1 ? "text-red-400" : "text-slate-300"}`}>{svc.error_rate}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
