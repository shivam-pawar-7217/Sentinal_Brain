"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import type { UIMessage } from "ai";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Brain,
  Zap,
  Terminal,
  Shield,
  Activity,
  Sparkles,
  Loader2,
  ClipboardCopy,
  Check,
  AlertTriangle,
  BookOpen,
  X,
  LogOut,
  User,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MetricChart, LogTerminal, ActionPanel, SystemHealth, getSkeletonForTool } from "@/components/shards";
import { Sidebar, type ChatSession } from "@/components/Sidebar";
import type { MetricPoint, SlowLog, PaymentGatewayLog, SystemHealthData } from "@/lib/mock-data";

// ─── Notification Sound (Web Audio API) ───────────────────────────────────────

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not available — silently ignore
  }
}

// ─── Session Persistence ──────────────────────────────────────────────────────

const STORAGE_KEY = "sentinelbrain_sessions";
const ACTIVE_KEY = "sentinelbrain_active";

interface StoredSession {
  id: string;
  title: string;
  timestamp: string;
  messages: UIMessage[];
  hasIncident: boolean;
}

function loadSessions(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: StoredSession[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Storage full — silently ignore
  }
}

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateTitle(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New Conversation";
  const text = firstUser.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ");
  return text.length > 50 ? text.substring(0, 50) + "..." : text;
}

// ─── Export Report ────────────────────────────────────────────────────────────

function exportReport(messages: UIMessage[]): string {
  const lines: string[] = [
    "# SentinelBrain Incident Report",
    `**Generated:** ${new Date().toISOString()}`,
    `**Messages:** ${messages.length}`,
    "",
    "---",
    "",
  ];

  for (const msg of messages) {
    lines.push(`## ${msg.role === "user" ? "👤 Engineer" : "🤖 SentinelBrain"}`);
    for (const part of msg.parts) {
      if (part.type === "text") {
        lines.push(part.text);
      } else {
        const partAny = part as { type: string; state?: string; toolName?: string; output?: unknown };
        const toolName = partAny.type.startsWith("tool-") ? partAny.type.replace("tool-", "") : partAny.toolName;
        if (toolName && partAny.state === "output-available") {
          lines.push(`\n### Tool: \`${toolName}\`\n`);
          lines.push("```json");
          lines.push(JSON.stringify(partAny.output, null, 2).substring(0, 2000));
          lines.push("```\n");
        }
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Tool Result Renderers ────────────────────────────────────────────────────

function renderToolResult(toolName: string, output: unknown) {
  switch (toolName) {
    case "fetchDBMetrics": {
      const data = output as { latency: MetricPoint[]; connections: MetricPoint[]; throughput: MetricPoint[] };
      return (
        <div className="grid gap-3 lg:grid-cols-3">
          <MetricChart title="DB Latency" data={data.latency} color="#f43f5e" unit="ms" thresholdValue={100} thresholdLabel="SLA: 100ms" />
          <MetricChart title="Active Connections" data={data.connections} color="#8b5cf6" unit="" thresholdValue={200} thresholdLabel="Pool Limit" />
          <MetricChart title="Query Throughput" data={data.throughput} color="#06b6d4" unit="q/s" />
        </div>
      );
    }
    case "getRecentSlowLogs": {
      const logs = output as SlowLog[];
      return <LogTerminal title="Slow Query Log — production_primary" logs={logs} variant="slow-query" />;
    }
    case "fetchPaymentMetrics": {
      const data = output as { success_rate: MetricPoint[]; response_time: MetricPoint[]; error_count: MetricPoint[] };
      return (
        <div className="grid gap-3 lg:grid-cols-3">
          <MetricChart title="Payment Success Rate" data={data.success_rate} color="#10b981" unit="%" thresholdValue={95} thresholdLabel="SLA: 95%" />
          <MetricChart title="Gateway Response Time" data={data.response_time} color="#f59e0b" unit="ms" thresholdValue={3000} thresholdLabel="Timeout" />
          <MetricChart title="Error Count" data={data.error_count} color="#ef4444" unit="" />
        </div>
      );
    }
    case "getPaymentLogs": {
      const logs = output as PaymentGatewayLog[];
      return <LogTerminal title="Payment Gateway Logs — stripe/adyen" logs={logs} variant="payment" />;
    }
    case "getSystemHealth": {
      const services = output as SystemHealthData[];
      return <SystemHealth services={services} />;
    }
    case "getRemediationActions": {
      return <ActionPanel />;
    }
    case "searchKnowledgeBase": {
      const data = output as { results: { id: string; title: string; severity: string; content: string }[]; team_context: { on_call: string } };
      if (!data.results || data.results.length === 0) return null;
      return (
        <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <BookOpen className="h-3.5 w-3.5" />
            Knowledge Base — {data.results.length} runbook{data.results.length > 1 ? "s" : ""} found
          </div>
          <div className="space-y-2">
            {data.results.map((rb) => (
              <div key={rb.id} className="rounded-lg border border-white/[0.04] bg-black/20 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${rb.severity === "P0" ? "bg-red-500/15 text-red-400" : rb.severity === "P1" ? "bg-amber-500/15 text-amber-400" : "bg-slate-500/15 text-slate-400"}`}>
                    {rb.severity}
                  </span>
                  <span className="text-xs font-medium text-slate-300">{rb.title}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-slate-600">
            On-call: {data.team_context.on_call}
          </div>
        </div>
      );
    }
    default:
      return <pre className="rounded-lg bg-white/5 p-3 font-mono text-xs text-slate-400">{JSON.stringify(output, null, 2)}</pre>;
  }
}

// ─── Suggestion Chips ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: <Zap className="h-3.5 w-3.5" />, text: "Show me why the DB is slow" },
  { icon: <Shield className="h-3.5 w-3.5" />, text: "Why are payments failing?" },
  { icon: <Activity className="h-3.5 w-3.5" />, text: "Give me a full system health check" },
  { icon: <Terminal className="h-3.5 w-3.5" />, text: "The production API is lagging" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SentinelBrainPage() {
  const router = useRouter();
  // Auth state
  const [authUser, setAuthUser] = useState<{ name: string; role: string; user: string } | null>(null);
  // Session management
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const notifiedToolsRef = useRef<Set<string>>(new Set());

  // Auth guard — redirect to /login if not authenticated
  useEffect(() => {
    const auth = localStorage.getItem("sb_auth");
    if (!auth) {
      router.replace("/login");
      return;
    }
    try {
      setAuthUser(JSON.parse(auth));
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // Memoize transport so it's stable across renders
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);

  // Mark as mounted (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load sessions from localStorage on mount
  useEffect(() => {
    if (!mounted) return;
    const stored = loadSessions();
    setSessions(stored);
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (activeId && stored.find((s) => s.id === activeId)) {
      setActiveSessionId(activeId);
    }
  }, [mounted]);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Persist messages to session whenever they change
  useEffect(() => {
    if (messages.length === 0) return;

    const sessionId = activeSessionId || generateSessionId();

    setSessions((prev) => {
      const existing = prev.find((s) => s.id === sessionId);
      const hasIncident = messages.some((m) =>
        m.parts.some((p) => {
          const partAny = p as { type: string; state?: string };
          return partAny.type.startsWith("tool-") && partAny.state === "output-available";
        })
      );

      const updated: StoredSession = {
        id: sessionId,
        title: generateTitle(messages),
        timestamp: new Date().toLocaleString(),
        messages,
        hasIncident,
      };

      const newSessions = existing
        ? prev.map((s) => (s.id === sessionId ? updated : s))
        : [updated, ...prev];

      saveSessions(newSessions);
      return newSessions;
    });

    if (!activeSessionId) {
      const newId = sessionId;
      setActiveSessionId(newId);
      localStorage.setItem(ACTIVE_KEY, newId);
    }
  }, [messages, activeSessionId]);

  // Notification sound for critical tool results
  useEffect(() => {
    for (const msg of messages) {
      for (const part of msg.parts) {
        const partAny = part as { type: string; state?: string; toolCallId?: string };
        if (partAny.state === "output-available" && partAny.toolCallId && !notifiedToolsRef.current.has(partAny.toolCallId)) {
          notifiedToolsRef.current.add(partAny.toolCallId);
          const toolName = partAny.type.startsWith("tool-") ? partAny.type.replace("tool-", "") : "";
          if (["fetchDBMetrics", "fetchPaymentMetrics", "getSystemHealth"].includes(toolName)) {
            playNotificationSound();
          }
        }
      }
    }
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setInput("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSubmit = useCallback(
    (text?: string) => {
      const msg = text || input.trim();
      if (!msg || isStreaming) return;
      sendMessage({ text: msg });
      setInput("");
      inputRef.current?.focus();
    },
    [input, isStreaming, sendMessage]
  );

  const handleNewSession = useCallback(() => {
    setActiveSessionId(null);
    localStorage.removeItem(ACTIVE_KEY);
    window.location.reload();
  }, []);

  const handleSelectSession = useCallback(
    (id: string) => {
      setActiveSessionId(id);
      localStorage.setItem(ACTIVE_KEY, id);
      window.location.reload();
    },
    []
  );

  const handleDeleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        saveSessions(updated);
        return updated;
      });
      if (activeSessionId === id) {
        setActiveSessionId(null);
        localStorage.removeItem(ACTIVE_KEY);
        window.location.reload();
      }
    },
    [activeSessionId]
  );

  const handleExport = useCallback(() => {
    const report = exportReport(messages);
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [messages]);

  const sidebarSessions: ChatSession[] = useMemo(
    () =>
      sessions.map((s) => ({
        id: s.id,
        title: s.title,
        timestamp: s.timestamp,
        messageCount: s.messages.length,
        hasIncident: s.hasIncident,
      })),
    [sessions]
  );

  return (
    <div className="flex h-screen flex-col bg-[#050709]">
      {/* ── Sidebar ────────────────────────────────────────── */}
      <Sidebar
        sessions={sidebarSessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/[0.04] bg-[#080a0e]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3 pl-10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 animate-glow">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">SentinelBrain</h1>
              <p className="text-[10px] font-medium tracking-wider text-indigo-400/70">AI-NATIVE DEVOPS COPILOT</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/integrations")}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-[10px] font-medium text-slate-400 ring-1 ring-white/[0.06] transition-all hover:bg-white/10 hover:text-slate-200"
            >
              <Zap className="h-3 w-3" />
              Integrations
            </button>
            {messages.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-[10px] font-medium text-slate-400 ring-1 ring-white/[0.06] transition-all hover:bg-white/10 hover:text-slate-200"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <ClipboardCopy className="h-3 w-3" />}
                {copied ? "Copied!" : "Export Report"}
              </button>
            )}
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
            <span className="hidden rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-500 sm:block">
              <kbd className="font-mono">Ctrl+K</kbd> to focus
            </span>
            {/* User Profile */}
            {authUser && (
              <div className="ml-2 flex items-center gap-2 border-l border-white/[0.06] pl-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                  {authUser.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="hidden sm:block">
                  <p className="text-[11px] font-medium text-slate-300">{authUser.name}</p>
                  <p className="text-[9px] text-slate-600">{authUser.role}</p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("sb_auth");
                    router.push("/login");
                  }}
                  className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white/5 hover:text-red-400"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Error Banner ───────────────────────────────────── */}
      {error && (
        <div className="shrink-0 border-b border-red-500/20 bg-red-500/5 px-6 py-3">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-red-400">Connection Error</p>
              <p className="mt-0.5 truncate text-[10px] text-red-400/60">
                {error.message || "Failed to connect to the AI agent. Check your GROQ_API_KEY in .env.local"}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="shrink-0 rounded bg-red-500/20 px-2.5 py-1 text-[10px] font-medium text-red-400 transition-colors hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ── Chat Area ──────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {messages.length === 0 ? (
            /* ── Empty State ─── */
            <div className="flex flex-col items-center justify-center pt-[12vh]">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/10 animate-glow">
                  <Brain className="h-10 w-10 text-indigo-400" />
                </div>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-white">Command Center</h2>
              <p className="mb-2 max-w-md text-center text-sm text-slate-500">
                Your AI-native DevOps copilot. Ask about infrastructure health,
                diagnose incidents, and execute remediation — all from one interface.
              </p>
              <p className="mb-8 text-center text-[10px] text-slate-700">
                Powered by Generative UI · 100% data fidelity · Built-in runbook memory
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => handleSubmit(s.text)}
                    className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left text-xs text-slate-400 transition-all duration-200 hover:border-indigo-500/20 hover:bg-indigo-500/5 hover:text-slate-200 hover:shadow-lg hover:shadow-indigo-500/5"
                  >
                    <span className="text-indigo-400">{s.icon}</span>
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Messages ─── */
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                  {message.role === "assistant" && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/10">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                  )}
                  <div className={`min-w-0 max-w-full space-y-3 ${message.role === "user" ? "max-w-[70%]" : "flex-1"}`}>
                    {message.role === "user" ? (
                      <div className="rounded-2xl rounded-br-md bg-indigo-600/90 px-4 py-2.5 text-sm text-white animate-slide-up">
                        {message.parts.map((part, i) => part.type === "text" ? <span key={i}>{part.text}</span> : null)}
                      </div>
                    ) : (
                      message.parts.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return part.text ? (
                              <div key={i} className="prose-sentinel animate-slide-up">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {part.text}
                                </ReactMarkdown>
                              </div>
                            ) : null;
                          case "step-start":
                            return i > 0 ? <div key={i} className="border-t border-white/[0.04] pt-2" /> : null;
                          default: {
                            // Handle tool parts
                            const partAny = part as { type: string; state?: string; toolName?: string; output?: unknown; toolCallId?: string };
                            const toolName = partAny.type.startsWith("tool-") ? partAny.type.replace("tool-", "") : partAny.toolName;

                            if (!toolName) return null;

                            if (partAny.state === "input-streaming" || partAny.state === "input-available") {
                              return (
                                <div key={partAny.toolCallId || i} className="animate-slide-up">
                                  {getSkeletonForTool(toolName)}
                                </div>
                              );
                            }

                            if (partAny.state === "output-available" && partAny.output != null) {
                              return (
                                <div key={partAny.toolCallId || i} className="animate-slide-up">
                                  {renderToolResult(toolName, partAny.output)}
                                </div>
                              );
                            }

                            if (partAny.state === "output-error") {
                              return (
                                <div key={partAny.toolCallId || i} className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 animate-slide-up">
                                  <X className="h-3.5 w-3.5" />
                                  Error executing <span className="font-mono">{toolName}</span>
                                </div>
                              );
                            }

                            return null;
                          }
                        }
                      })
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && messages.length > 0 && !messages[messages.length - 1]?.parts.some(p => p.type === "text" || (p as {state?: string}).state === "input-streaming") && (
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/10">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    <span className="text-xs text-slate-500">Analyzing infrastructure...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Input Bar ──────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/[0.04] bg-[#080a0e]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 transition-all duration-200 focus-within:border-indigo-500/30 focus-within:bg-white/[0.03] focus-within:shadow-lg focus-within:shadow-indigo-500/5"
          >
            <Terminal className="h-4 w-4 shrink-0 text-slate-600" />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask SentinelBrain anything... e.g. 'Show me why the DB is slow'"
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
              disabled={isStreaming}
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput("")}
                className="flex h-5 w-5 items-center justify-center rounded text-slate-600 transition-colors hover:text-slate-400"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all duration-200 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:hover:shadow-none"
            >
              {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-slate-700">
            SentinelBrain v0.1.0 · AI-Native DevOps Copilot · Mock Mode · <kbd className="rounded bg-white/5 px-1 py-0.5 font-mono text-[9px]">Ctrl+K</kbd> focus · <kbd className="rounded bg-white/5 px-1 py-0.5 font-mono text-[9px]">Esc</kbd> clear
          </p>
        </div>
      </div>
    </div>
  );
}
