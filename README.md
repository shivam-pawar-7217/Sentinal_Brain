<div align="center">
  <div style="padding: 1.5rem; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 1rem; display: inline-block; margin-bottom: 1rem;">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4 4.5 4.5 0 0 1-3-4"/>
    </svg>
  </div>
  
  <h1>SentinelBrain</h1>
  <p><strong>The AI-Native DevOps Second Brain</strong></p>
  
  <p>
    <a href="https://sentinel-brain.vercel.app"><b>Live Demo</b></a> •
    <a href="#features"><b>Features</b></a> •
    <a href="ARCHITECTURE.md"><b>Architecture Docs</b></a>
  </p>
</div>

---

## ⚡️ Overview

SentinelBrain replaces fragmented DevOps dashboards with a single, agentic command center. Instead of hunting through Datadog, AWS, and PagerDuty during an outage, engineers simply ask natural language questions (e.g., *"Why is the DB slow?"*). 

The AI dynamically generates the exact diagnostic UI required (Generative UI) in real-time, cross-referencing your company's internal runbooks to suggest immediate remediation steps.

**Built for YC S26.**

## 🌟 Key Features

* **🧠 Generative UI:** The AI streams interactive React components ("Shards") instead of plain text—rendering live charts, terminal logs, and system health grids on the fly.
* **📚 Runbook Memory:** SentinelBrain acts as a "Second Brain," mapping current infrastructure symptoms to historical incident playbooks.
* **🔌 Enterprise Connectors:** A unified hub built to ingest telemetry from AWS, Azure, Kubernetes, Datadog, PagerDuty, and more.
* **⚠️ One-Click Remediation:** "Danger Zone" action buttons allow engineers to rollback deployments or restart clusters directly from the chat interface.

## 🛠️ Tech Stack

* **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS
* **AI Engine:** Vercel AI SDK v6
* **LLM:** Groq (Llama-3.1-8b) for ultra-fast, deterministic tool calling
* **Visuals:** Recharts, Lucide Icons, Custom CSS glassmorphism

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/shivam-pawar-7217/Sentinal_Brain.git
   cd Sentinal_Brain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file and add your Groq API key:
   ```env
   GROQ_API_KEY=gsk_your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` to access the Command Center.

## 📖 Architecture

For a deep dive into how the AI Agent tools map to the Generative UI shards, please read the [Architecture Guide](./ARCHITECTURE.md).

## 📄 License
MIT License - Copyright (c) 2026 SentinelBrain Inc.
