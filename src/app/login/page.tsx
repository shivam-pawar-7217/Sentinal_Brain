"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  Shield,
  Activity,
  Zap,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Mail,
} from "lucide-react";

const FEATURES = [
  {
    icon: <Brain className="h-5 w-5" />,
    title: "AI-Native Diagnosis",
    desc: "Root-cause analysis powered by Generative UI",
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: "Real-Time Monitoring",
    desc: "Live metrics with anomaly detection",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Incident Runbooks",
    desc: "Second Brain memory of past resolutions",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "One-Click Remediation",
    desc: "Rollback, reboot, and fix from one interface",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    // Simulate auth delay
    await new Promise((r) => setTimeout(r, 1200));

    // Mock auth — accept any email/password for demo
    localStorage.setItem("sb_auth", JSON.stringify({
      user: email,
      name: email.split("@")[0],
      role: "Platform Engineer",
      org: "SentinelBrain Inc.",
      loginAt: new Date().toISOString(),
    }));

    router.push("/");
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setEmail("engineer@sentinelbrain.dev");
    setPassword("••••••••");

    await new Promise((r) => setTimeout(r, 800));

    localStorage.setItem("sb_auth", JSON.stringify({
      user: "engineer@sentinelbrain.dev",
      name: "Shiva",
      role: "Platform Engineer",
      org: "SentinelBrain Inc.",
      loginAt: new Date().toISOString(),
    }));

    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-[#050709]">
      {/* ── Left Panel: Branding ────────────────────────────── */}
      <div className="relative hidden w-[480px] flex-col justify-between overflow-hidden border-r border-white/[0.04] bg-gradient-to-br from-[#080a0e] via-[#0d1117] to-[#0a0e14] p-10 lg:flex">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="pointer-events-none absolute -right-10 bottom-1/4 h-60 w-60 rounded-full bg-violet-600/10 blur-[80px]" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">SentinelBrain</h1>
              <p className="text-[10px] font-medium tracking-[0.2em] text-indigo-400/60">AI-NATIVE DEVOPS COPILOT</p>
            </div>
          </div>

          <h2 className="mb-3 text-3xl font-bold leading-tight text-white">
            Your DevOps
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Second Brain
            </span>
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-slate-500">
            Stop drowning in dashboards. SentinelBrain diagnoses incidents, surfaces root causes,
            and generates the exact interface you need to fix it — in seconds.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.02]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
                {f.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{f.title}</h4>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[10px] text-slate-700">
          <p>© 2026 SentinelBrain Inc. · YC S26 Applicant</p>
        </div>
      </div>

      {/* ── Right Panel: Login Form ──────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <Brain className="h-4.5 w-4.5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">SentinelBrain</h1>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white">Welcome back</h3>
            <p className="mt-1 text-sm text-slate-500">Sign in to access your command center</p>
          </div>

          {/* Demo Login Button */}
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/30 hover:brightness-110 disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            Launch Demo Mode
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-[#050709] px-3 text-slate-600">or sign in with credentials</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@company.com"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-indigo-500/30 focus:bg-white/[0.03] focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 pl-10 pr-12 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-indigo-500/30 focus:bg-white/[0.03] focus:ring-2 focus:ring-indigo-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition-colors hover:text-slate-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input type="checkbox" className="rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500/20" />
                Remember me
              </label>
              <button type="button" className="text-xs text-indigo-400 transition-colors hover:text-indigo-300">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-4 py-3 text-sm font-medium text-slate-200 transition-all duration-200 hover:bg-white/10 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* SSO */}
          <div className="mt-6 space-y-2">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.01] px-4 py-2.5 text-xs text-slate-400 transition-all hover:bg-white/[0.03] hover:text-slate-200">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Continue with GitHub
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.01] px-4 py-2.5 text-xs text-slate-400 transition-all hover:bg-white/[0.03] hover:text-slate-200">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google SSO
            </button>
          </div>

          <p className="mt-8 text-center text-[10px] text-slate-700">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
