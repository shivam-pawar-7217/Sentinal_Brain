"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Brain, Check, Plus, RefreshCw, Search, Settings, X, Shield, AlertCircle, Loader2, ExternalLink } from "lucide-react";
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
  isReal?: boolean; // true = real integration, false = coming soon
}

const INTEGRATIONS: Integration[] = [
  { id: "aws", name: "AWS CloudWatch", category: "Cloud", description: "EC2, RDS, Lambda metrics & alarms", connected: false, isReal: true },
  { id: "azure", name: "Azure Monitor", category: "Cloud", description: "VMs, SQL, AKS cluster telemetry", connected: false },
  { id: "gcp", name: "Google Cloud Ops", category: "Cloud", description: "GCE, Cloud SQL, GKE monitoring", connected: false },
  { id: "datadog", name: "Datadog", category: "Monitoring", description: "APM, infrastructure metrics, logs", connected: false },
  { id: "grafana", name: "Grafana Cloud", category: "Monitoring", description: "Prometheus, Loki, Tempo", connected: false },
  { id: "newrelic", name: "New Relic", category: "Monitoring", description: "Full-stack observability", connected: false },
  { id: "pagerduty", name: "PagerDuty", category: "Incidents", description: "Alerting, on-call, escalations", connected: false },
  { id: "opsgenie", name: "Opsgenie", category: "Incidents", description: "Alert routing, incident workflows", connected: false },
  { id: "slack", name: "Slack", category: "Comms", description: "Alert channels, war rooms", connected: false },
  { id: "teams", name: "Microsoft Teams", category: "Comms", description: "Notifications, adaptive cards", connected: false },
  { id: "kubernetes", name: "Kubernetes", category: "Infra", description: "Cluster health, pods, deployments", connected: false },
  { id: "terraform", name: "Terraform Cloud", category: "Infra", description: "State, drift detection, plans", connected: false },
  { id: "github", name: "GitHub Actions", category: "CI/CD", description: "Pipelines, commits, PR checks", connected: false },
  { id: "argocd", name: "Argo CD", category: "CI/CD", description: "GitOps, sync status, rollbacks", connected: false },
];

const TABS = ["All", "Cloud", "Monitoring", "Incidents", "Comms", "Infra", "CI/CD"];

// ─── AWS Connection Modal ─────────────────────────────────────────────────────

function AWSModal({ open, onClose, onConnected }: {
  open: boolean;
  onClose: () => void;
  onConnected: (arn: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [arn, setArn] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // CloudFormation Quick-Create URL
  const CF_TEMPLATE_URL = "https://sentinel-brain-public.s3.amazonaws.com/cloudformation/sentinel-brain-role.yaml";
  const CF_LAUNCH_URL = `https://console.aws.amazon.com/cloudformation/home#/stacks/quickcreate?templateURL=${encodeURIComponent(CF_TEMPLATE_URL)}&stackName=SentinelBrainAccess`;

  if (!open) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/integrations/aws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleArn: arn, region, testOnly: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ success: true, message: `Connection verified — Account ${data.accountId || "confirmed"}` });
      } else {
        setTestResult({ success: false, message: data.error || "Connection failed" });
      }
    } catch {
      setTestResult({ success: false, message: "Network error" });
    }
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/aws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleArn: arn, region }),
      });
      if (res.ok) {
        onConnected(arn);
        onClose();
        setStep(1);
      } else {
        const data = await res.json();
        setTestResult({ success: false, message: data.error || "Failed to save" });
      }
    } catch {
      setTestResult({ success: false, message: "Network error" });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#0c0f15] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9900]/10">
              {logos.aws}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Connect AWS CloudWatch</h2>
              <p className="text-[10px] text-slate-500">Cross-Account IAM Role Assumption</p>
            </div>
          </div>
          <button onClick={() => { onClose(); setStep(1); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                step > s ? "bg-emerald-500 text-white" : step === s ? "bg-indigo-500 text-white" : "bg-white/[0.06] text-slate-600"
              }`}>
                {step > s ? <Check className="h-3 w-3" /> : s}
              </div>
              <span className={`text-[10px] font-medium ${step >= s ? "text-slate-300" : "text-slate-600"}`}>
                {s === 1 ? "Create Role" : s === 2 ? "Paste ARN" : "Verify"}
              </span>
              {s < 3 && <div className={`h-px flex-1 ${step > s ? "bg-emerald-500/40" : "bg-white/[0.06]"}`} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Launch CloudFormation ──────────────────── */}
        {step === 1 && (
          <div>
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-indigo-500/10 bg-indigo-500/5 p-3">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
              <p className="text-[11px] leading-relaxed text-slate-400">
                We&apos;ll open AWS CloudFormation in a new tab. It will create a <span className="text-indigo-400 font-medium">read-only IAM Role</span> in your AWS account. SentinelBrain will never have write access to your infrastructure.
              </p>
            </div>

            <div className="mb-4 rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
              <h4 className="mb-2 text-xs font-medium text-slate-300">What gets created:</h4>
              <ul className="space-y-1.5 text-[11px] text-slate-500">
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-500" /> IAM Role: <span className="font-mono text-slate-400">SentinelBrainReader</span></li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-500" /> Policy: <span className="font-mono text-slate-400">CloudWatchReadOnlyAccess</span></li>
                <li className="flex items-center gap-2"><Shield className="h-3 w-3 text-indigo-400" /> Trust: Only SentinelBrain can assume this role</li>
              </ul>
            </div>

            <a
              href={CF_LAUNCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF9900] py-3 text-xs font-semibold text-black transition-all hover:brightness-110"
              onClick={() => setTimeout(() => setStep(2), 500)}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Launch Stack in AWS Console
            </a>

            <button onClick={() => setStep(2)} className="w-full py-2 text-center text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
              I already have a Role ARN → Skip to Step 2
            </button>
          </div>
        )}

        {/* ── Step 2: Paste ARN ─────────────────────────────── */}
        {step === 2 && (
          <div>
            <p className="mb-4 text-xs text-slate-500">
              After creating the stack, go to the <span className="text-slate-300">Outputs</span> tab in CloudFormation and copy the <span className="font-mono text-indigo-400">RoleARN</span> value.
            </p>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">IAM Role ARN</label>
              <input
                value={arn}
                onChange={(e) => { setArn(e.target.value); setTestResult(null); }}
                placeholder="arn:aws:iam::123456789012:role/SentinelBrainReader"
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 font-mono text-xs text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/10"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">AWS Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-lg border border-white/[0.06] bg-[#0c0f15] px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/30"
              >
                <option value="us-east-1">US East (N. Virginia)</option>
                <option value="us-west-2">US West (Oregon)</option>
                <option value="eu-west-1">EU (Ireland)</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 rounded-lg border border-white/[0.08] py-2.5 text-xs text-slate-400 hover:bg-white/[0.04]">
                Back
              </button>
              <button
                onClick={() => { setStep(3); handleTest(); }}
                disabled={!arn}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110 disabled:opacity-40"
              >
                Test Connection
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Verify & Connect ──────────────────────── */}
        {step === 3 && (
          <div>
            {/* Test Result */}
            {testing && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                <div>
                  <p className="text-xs font-medium text-slate-200">Testing connection...</p>
                  <p className="text-[10px] text-slate-500">Assuming IAM Role via STS</p>
                </div>
              </div>
            )}

            {testResult && !testing && (
              <div className={`mb-4 rounded-lg border p-4 ${
                testResult.success
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-red-500/20 bg-red-500/5"
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                      <Check className="h-4 w-4 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    </div>
                  )}
                  <div>
                    <p className={`text-xs font-medium ${testResult.success ? "text-emerald-400" : "text-red-400"}`}>
                      {testResult.success ? "Connection Successful" : "Connection Failed"}
                    </p>
                    <p className="text-[10px] text-slate-500">{testResult.message}</p>
                  </div>
                </div>
              </div>
            )}

            {testResult?.success && !testing && (
              <div className="mb-4 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Role ARN</span>
                  <span className="font-mono text-slate-400">{arn.slice(0, 40)}...</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Region</span>
                  <span className="text-slate-400">{region}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Access</span>
                  <span className="text-emerald-400">Read-Only</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => { setStep(2); setTestResult(null); }} className="flex-1 rounded-lg border border-white/[0.08] py-2.5 text-xs text-slate-400 hover:bg-white/[0.04]">
                Back
              </button>
              {testResult?.success ? (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110 disabled:opacity-40"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                  Connect Securely
                </button>
              ) : !testing ? (
                <button
                  onClick={handleTest}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState(INTEGRATIONS);
  const [awsModalOpen, setAwsModalOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("sb_auth")) router.replace("/login");
    // Check if AWS is already connected
    fetch("/api/integrations/aws")
      .then((r) => r.json())
      .then((data) => {
        if (data.connected) {
          setItems((prev) =>
            prev.map((i) =>
              i.id === "aws"
                ? { ...i, connected: true, status: "healthy" as const, lastSync: "Live", throughput: "CloudWatch" }
                : i
            )
          );
        }
      })
      .catch(() => {});
  }, [router]);

  const handleCardClick = (id: string, isReal?: boolean) => {
    if (id === "aws") {
      setAwsModalOpen(true);
    } else if (!isReal) {
      // Coming soon — do nothing
    }
  };

  const handleAWSConnected = () => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === "aws"
          ? { ...i, connected: true, status: "healthy" as const, lastSync: "Just now", throughput: "CloudWatch" }
          : i
      )
    );
  };

  const list = items.filter((i) => {
    if (tab !== "All" && i.category !== tab) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const connected = items.filter((i) => i.connected).length;

  return (
    <div className="min-h-screen bg-[#050709] text-slate-200">
      {/* AWS Modal */}
      <AWSModal open={awsModalOpen} onClose={() => setAwsModalOpen(false)} onConnected={handleAWSConnected} />

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
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-600">{item.category}</span>
                        {item.isReal && (
                          <span className="rounded bg-emerald-500/10 px-1 py-0.5 text-[8px] font-bold text-emerald-400">LIVE</span>
                        )}
                        {!item.isReal && !item.connected && (
                          <span className="rounded bg-white/5 px-1 py-0.5 text-[8px] text-slate-600">SOON</span>
                        )}
                      </div>
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
                  <button
                    onClick={() => handleCardClick(item.id, item.isReal)}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-white/5 hover:text-slate-400"
                  >
                    <Settings className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleCardClick(item.id, item.isReal)}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-md border py-2 text-[11px] font-medium transition-colors ${
                    item.isReal
                      ? "border-indigo-500/20 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10"
                      : "border-white/[0.08] text-slate-500 cursor-default"
                  }`}
                >
                  {item.isReal ? (
                    <>
                      <Plus className="h-3 w-3" />
                      Connect
                    </>
                  ) : (
                    "Coming Soon"
                  )}
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
