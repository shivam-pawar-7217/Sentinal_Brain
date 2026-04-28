# SentinelBrain - Architecture & Developer Guide

Welcome to the SentinelBrain repository! This document serves as a comprehensive guide for teammates, outlining the current architecture, tech stack, and features implemented so far for the YC MVP.

## 🚀 Overview

**SentinelBrain** is an AI-native DevOps Copilot ("Second Brain"). It replaces static, fragmented dashboards (Datadog, AWS, PagerDuty) with an agentic interface. Engineers can ask natural language questions (e.g., "Show me why the DB is slow"), and the AI dynamically generates the exact diagnostic UI required (Generative UI) while cross-referencing internal company runbooks.

**Live Demo URL:** https://sentinel-brain.vercel.app

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16.2 (App Router) + React 19
- **Styling:** Tailwind CSS (Vanilla CSS for core animations/glassmorphism)
- **AI Engine:** Vercel AI SDK v6 (`@ai-sdk/react`, `ai`)
- **LLM Provider:** Groq (using `llama-3.1-8b-instant` for ultra-fast, free-tier inference and excellent tool-calling support)
- **Icons:** `lucide-react` + Custom inline SVGs for brand logos
- **Charts:** `recharts`
- **Markdown Rendering:** `react-markdown` + `remark-gfm`
- **Build Tool:** Turbopack

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── api/chat/route.ts      # Core AI Agent & Tool calling logic (Backend)
│   ├── integrations/page.tsx  # Integrations Hub UI
│   ├── login/page.tsx         # Authentication/Login UI
│   ├── layout.tsx             # Root layout & Google Fonts
│   └── page.tsx               # Main Dashboard (Command Center) & Chat UI
├── components/
│   ├── IntegrationLogos.tsx   # Real SVG brand logos for integrations
│   └── shards/                # Generative UI Components (rendered by AI)
│       ├── ActionPanel.tsx    # Remediation action buttons
│       ├── LogTerminal.tsx    # Terminal UI for raw logs
│       ├── MetricChart.tsx    # Recharts visualizations
│       ├── Skeletons.tsx      # Loading states for AI streaming
│       └── SystemHealth.tsx   # Grid showing service status
└── lib/
    ├── knowledge.json         # Simulated internal company runbooks/playbooks
    └── mock-data.ts           # Mock Engine for DB latency, logs, alerts, etc.
```

---

## 🧠 The Agent Engine (`api/chat/route.ts`)

The heart of SentinelBrain is the Vercel AI SDK backend. The AI is equipped with **Tools** that it can call autonomously based on the user's prompt. 

### Available Tools
1. **`fetchDBMetrics`**: Returns simulated timeseries data for latency, connections, and throughput.
2. **`getRecentSlowLogs`**: Returns raw SQL queries and execution times.
3. **`checkSystemHealth`**: Checks the mock status of core services (API, DB, Redis).
4. **`getActiveAlerts`**: Fetches active PagerDuty/Datadog incidents.
5. **`searchKnowledgeBase`**: Queries `knowledge.json` for historical runbooks to match current symptoms against past incidents.

**Workflow:**
User Prompt ➡️ Agent analyzes request ➡️ Agent calls 1+ Tools in parallel ➡️ Tools fetch data from Mock Engine ➡️ Agent receives data ➡️ Agent streams text + UI Shards back to client.

---

## 🎨 Generative UI (The "Shards")

Instead of just streaming text, SentinelBrain streams interactive React components called "Shards". When the `chat/route.ts` API returns a tool call result, the `page.tsx` UI intercepts it and renders the corresponding Shard.

- **`MetricChart`**: Renders `recharts` graphs for metrics.
- **`LogTerminal`**: A 100% data-fidelity log viewer.
- **`ActionPanel`**: "Danger Zone" buttons to resolve issues (e.g., "Rollback", "Add Index").
- **`SystemHealth`**: A high-level status summary with real-time jitter effects.

All components are styled with a premium, dark-mode, glassmorphic aesthetic (Tailwind + CSS animations).

---

## 🔌 The Mock Engine & Data Layer

Since we don't have access to the user's real AWS or Datadog accounts yet, the entire backend is powered by `src/lib/mock-data.ts`. This allows the demo to function deterministically.

- If a user asks "Show me why the DB is slow", the mock engine generates realistic PostgreSQL latency spikes and slow `JOIN` queries.
- `knowledge.json` acts as the company's "Second Brain", storing past incidents so the AI can say: *"Last time this happened on April 15, we resolved it by adding an index."*

---

## 🔐 Authentication & Flow

We implemented a polished, enterprise-feeling flow to frame the MVP:

1. **`/login`**: A premium auth page with features, mock SSO, and a "Launch Demo Mode" button.
2. **Auth Guard**: `page.tsx` and `integrations/page.tsx` check `localStorage` for `sb_auth`. Unauthenticated users are redirected to `/login`.
3. **`/integrations`**: A minimalist, Linear-style hub showing 14 real enterprise connectors (AWS, Datadog, Slack, K8s, etc.). This demonstrates to investors *how* the product will pull real data in the future.

---

## 🔧 Environment Setup

To run locally:
1. Copy `.env.local` or create it.
2. Get a free API key from [Groq Console](https://console.groq.com/keys).
3. Add: `GROQ_API_KEY=gsk_your_key_here`
4. Run `npm install`
5. Run `npm run dev`

---

## 🎯 Next Steps for Production (Post-YC)

To move from a mock demo to a real SaaS product, the following needs to be replaced:
1. **Real Data Connectors**: Replace `mock-data.ts` with OAuth integrations or API calls to Datadog, AWS CloudWatch, and PagerDuty.
2. **Vector Database**: Replace `knowledge.json` with a Vector DB (e.g., Pinecone or Postgres pgvector) and implement RAG (Retrieval-Augmented Generation) for ingesting thousands of company Notion/Confluence runbooks.
3. **Real Auth**: Replace `localStorage` mock auth with NextAuth, Clerk, or Supabase.
4. **Action Execution**: Connect the `ActionPanel` buttons to real CI/CD pipelines (e.g., triggering a GitHub Actions rollback or a K8s restart).
