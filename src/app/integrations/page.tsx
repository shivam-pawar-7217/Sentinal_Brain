"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, Check, Plus, RefreshCw, Search, Settings } from "lucide-react";
import { logos } from "@/components/IntegrationLogos";

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  connected: boolean;
  status?: "healthy" | "degraded";
  lastSync?: string;
  throughput?: string;
}

const INTEGRATIONS: Integration[] = [
  { id: "aws", name: "AWS CloudWatch", category: "Cloud", description: "EC2, RDS, Lambda metrics & alarms", connected: true, status: "healthy", lastSync: "2m ago", throughput: "14.2K/min" },
  { id: "azure", name: "Azure Monitor", category: "Cloud", description: "VMs, SQL, AKS cluster telemetry", connected: true, status: "healthy", lastSync: "1m ago", throughput: "8.7K/min" },
  { id: "gcp", name: "Google Cloud Ops", category: "Cloud", description: "GCE, Cloud SQL, GKE monitoring", connected: false },
  { id: "datadog", name: "Datadog", category: "Monitoring", description: "APM, infrastructure metrics, logs", connected: true, status: "healthy", lastSync: "30s ago", throughput: "52.1K/min" },
  { id: "grafana", name: "Grafana Cloud", category: "Monitoring", description: "Prometheus, Loki, Tempo", connected: false },
  { id: "newrelic", name: "New Relic", category: "Monitoring", description: "Full-stack observability", connected: false },
  { id: "pagerduty", name: "PagerDuty", category: "Incidents", description: "Alerting, on-call, escalations", connected: true, status: "healthy", lastSync: "5m ago", throughput: "3 active" },
  { id: "opsgenie", name: "Opsgenie", category: "Incidents", description: "Alert routing, incident workflows", connected: false },
  { id: "slack", name: "Slack", category: "Comms", description: "Alert channels, war rooms", connected: true, status: "healthy", lastSync: "Now", throughput: "#incidents" },
  { id: "teams", name: "Microsoft Teams", category: "Comms", description: "Notifications, adaptive cards", connected: false },
  { id: "kubernetes", name: "Kubernetes", category: "Infra", description: "Cluster health, pods, deployments", connected: true, status: "degraded", lastSync: "45s ago", throughput: "147 pods" },
  { id: "terraform", name: "Terraform Cloud", category: "Infra", description: "State, drift detection, plans", connected: false },
  { id: "github", name: "GitHub Actions", category: "CI/CD", description: "Pipelines, commits, PR checks", connected: true, status: "healthy", lastSync: "3m ago", throughput: "12 workflows" },
  { id: "argocd", name: "Argo CD", category: "CI/CD", description: "GitOps, sync status, rollbacks", connected: false },
];

const TABS = ["All", "Cloud", "Monitoring", "Incidents", "Comms", "Infra", "CI/CD"];

export default function IntegrationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState(INTEGRATIONS);

  useEffect(() => {
    if (!localStorage.getItem("sb_auth")) router.replace("/login");
  }, [router]);

  const connect = (id: string) => {
    setItems((p) => p.map((i) => i.id === id ? { ...i, connected: true, status: "healthy" as const, lastSync: "Now", throughput: "Syncing..." } : i));
  };

  const list = items.filter((i) => {
    if (tab !== "All" && i.category !== tab) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const connected = items.filter((i) => i.connected).length;

  return (
    <div className="min-h-screen bg-[#050709] text-slate-200">
      {/* Header */}
      <header className="border-b border-white/[0.04] bg-[#080a0e]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <button onClick={() => router.push("/")} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Brain className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Integrations</span>
          </div>
          <div className="ml-auto text-xs text-slate-500">{connected}/{items.length} connected</div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white">Connect your stack</h1>
          <p className="mt-1 text-sm text-slate-500">
            Plug in your cloud, monitoring, and incident tools. SentinelBrain pulls live telemetry to diagnose issues.
          </p>
        </div>

        {/* Tabs + Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === t ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-56 rounded-md border border-white/[0.06] bg-transparent py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-white/[0.12]" />
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item) => (
            <div key={item.id} className="flex flex-col justify-between border-b border-r border-white/[0.04] bg-[#080a0e] p-5 last:border-b-0 transition-colors hover:bg-[#0c0f15]">
              <div>
                {/* Top row */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                      {logos[item.id]}
                    </div>
                    <div>
                      <h3 className="text-[13px] font-medium text-slate-200">{item.name}</h3>
                      <span className="text-[10px] text-slate-600">{item.category}</span>
                    </div>
                  </div>
                  {item.connected && item.status && (
                    <span className={`h-2 w-2 rounded-full ${item.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  )}
                </div>
                <p className="mb-4 text-[11px] leading-relaxed text-slate-500">{item.description}</p>
              </div>

              {/* Bottom */}
              {item.connected ? (
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-slate-600">
                    <span className="text-slate-500">{item.lastSync}</span> · <span className="font-mono text-indigo-400/70">{item.throughput}</span>
                  </div>
                  <button className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-white/5 hover:text-slate-400">
                    <Settings className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => connect(item.id)} className="flex w-full items-center justify-center gap-1.5 rounded-md border border-white/[0.08] py-2 text-[11px] font-medium text-slate-400 transition-colors hover:border-white/[0.15] hover:bg-white/[0.03] hover:text-white">
                  <Plus className="h-3 w-3" />
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>

        {list.length === 0 && (
          <div className="py-20 text-center text-sm text-slate-600">No integrations match your search.</div>
        )}
      </div>
    </div>
  );
}
