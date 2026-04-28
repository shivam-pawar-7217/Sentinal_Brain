"use client";

import { useState } from "react";
import { RotateCcw, Power, ShieldAlert, Trash2, AlertTriangle } from "lucide-react";

interface Action {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  severity: "warning" | "danger" | "critical";
}

const ACTIONS: Action[] = [
  { id: "rollback", label: "Rollback Deploy", description: "Revert to previous stable deployment v2.14.7", icon: <RotateCcw className="h-4 w-4" />, severity: "warning" },
  { id: "reboot", label: "Reboot Service", description: "Hard restart the affected service instances", icon: <Power className="h-4 w-4" />, severity: "danger" },
  { id: "kill-queries", label: "Kill Slow Queries", description: "Terminate all queries running > 5000ms", icon: <ShieldAlert className="h-4 w-4" />, severity: "warning" },
  { id: "flush-cache", label: "Flush Cache Layer", description: "Invalidate and rebuild Redis cache cluster", icon: <Trash2 className="h-4 w-4" />, severity: "critical" },
];

const SEVERITY_STYLES = {
  warning: "border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30",
  danger: "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30",
  critical: "border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30",
};

export function ActionPanel() {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [executed, setExecuted] = useState<Set<string>>(new Set());

  const handleExecute = (id: string) => {
    setExecuted((prev) => new Set(prev).add(id));
    setConfirming(null);
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0d1117] to-[#161b22] p-5 shadow-2xl">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-200">Danger Zone — Remediation Actions</h3>
      </div>
      <div className="grid gap-2">
        {ACTIONS.map((action) => (
          <div key={action.id} className="relative">
            {confirming === action.id ? (
              <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 animate-in fade-in">
                <span className="text-xs text-amber-300">Confirm {action.label}?</span>
                <button onClick={() => handleExecute(action.id)} className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500">Execute</button>
                <button onClick={() => setConfirming(null)} className="rounded bg-white/5 px-3 py-1 text-xs text-slate-400 transition-colors hover:bg-white/10">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => executed.has(action.id) ? null : setConfirming(action.id)}
                disabled={executed.has(action.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 ${
                  executed.has(action.id) ? "cursor-default border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : SEVERITY_STYLES[action.severity]
                }`}
              >
                {action.icon}
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold">{action.label}</span>
                  <span className="block text-[10px] opacity-60">{action.description}</span>
                </div>
                {executed.has(action.id) && <span className="shrink-0 text-[10px] font-medium text-emerald-400">✓ Executed</span>}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
