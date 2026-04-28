"use client";

import { useState } from "react";
import type { SlowLog, PaymentGatewayLog } from "@/lib/mock-data";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";

type LogEntry = SlowLog | PaymentGatewayLog;

interface LogTerminalProps {
  title: string;
  logs: LogEntry[];
  variant?: "slow-query" | "payment";
}

function isSlowLog(log: LogEntry): log is SlowLog {
  return "query" in log;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function SlowQueryEntry({ log, index }: { log: SlowLog; index: number }) {
  const [expanded, setExpanded] = useState(index < 2);
  const severity = log.duration_ms > 3000 ? "text-red-400" : log.duration_ms > 1500 ? "text-amber-400" : "text-yellow-300";

  return (
    <div className="group border-b border-white/[0.04] last:border-0">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-white/[0.02]">
        {expanded ? <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" /> : <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />}
        <span className="shrink-0 font-mono text-[11px] text-slate-600">{log.timestamp}</span>
        <span className={`shrink-0 font-mono text-[11px] font-bold ${severity}`}>{log.duration_ms}ms</span>
        <span className="min-w-0 truncate font-mono text-[11px] text-slate-400">{log.source}</span>
      </button>
      {expanded && (
        <div className="ml-5 space-y-1 px-3 pb-3">
          <div className="flex items-start">
            <pre className="w-full overflow-x-auto whitespace-pre-wrap break-all rounded bg-black/40 p-2.5 font-mono text-[11px] leading-relaxed text-emerald-300/90">{log.query}</pre>
            <CopyButton text={log.query} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono text-[10px] text-slate-600">
            <span>rows_examined: <span className="text-slate-400">{log.rows_examined.toLocaleString()}</span></span>
            <span>rows_sent: <span className="text-slate-400">{log.rows_sent.toLocaleString()}</span></span>
            <span>lock_time: <span className="text-slate-400">{log.lock_time_ms}ms</span></span>
            <span>user: <span className="text-slate-400">{log.user}</span></span>
            <span>db: <span className="text-slate-400">{log.db}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentLogEntry({ log }: { log: PaymentGatewayLog }) {
  const statusColor = log.status === "success" ? "text-emerald-400" : log.status === "failure" ? "text-red-400" : "text-amber-400";
  return (
    <div className="flex items-center gap-2 border-b border-white/[0.04] px-3 py-2 font-mono text-[11px] last:border-0">
      <span className="shrink-0 text-slate-600">{log.timestamp}</span>
      <span className={`shrink-0 font-bold uppercase ${statusColor}`}>{log.status}</span>
      <span className="shrink-0 text-slate-500">{log.provider}</span>
      <span className="text-slate-300">${log.amount}</span>
      {log.error_code && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">{log.error_code}</span>}
      <span className="shrink-0 text-slate-600">{log.response_time_ms}ms</span>
      <span className="ml-auto truncate text-slate-700">{log.trace_id}</span>
    </div>
  );
}

export function LogTerminal({ title, logs, variant = "slow-query" }: LogTerminalProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0e14] shadow-2xl">
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0d1117] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="ml-2 text-xs font-medium text-slate-400">{title}</span>
        <span className="ml-auto rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-600">{logs.length} entries</span>
      </div>
      <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
        {logs.map((log, i) =>
          variant === "slow-query" && isSlowLog(log)
            ? <SlowQueryEntry key={log.id} log={log} index={i} />
            : <PaymentLogEntry key={log.id} log={log as PaymentGatewayLog} />
        )}
      </div>
    </div>
  );
}
