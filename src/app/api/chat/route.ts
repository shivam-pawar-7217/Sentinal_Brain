import { convertToModelMessages, streamText, UIMessage, stepCountIs } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import {
  fetchDBMetrics,
  getRecentSlowLogs,
  fetchPaymentMetrics,
  getPaymentLogs,
  getSystemHealth,
} from "@/lib/mock-data";
import { fetchLiveCloudWatchMetrics } from "@/lib/aws";
import knowledgeBase from "@/lib/knowledge.json";
import { readFileSync } from "fs";
import { join } from "path";

import { cookies } from "next/headers";

// Read saved AWS connection
async function getAWSConnection(): Promise<{ roleArn: string; region: string } | null> {
  const cookieStore = await cookies();
  const awsConnStr = cookieStore.get("sb_aws_conn")?.value;
  if (!awsConnStr) return null;
  try {
    return JSON.parse(awsConnStr);
  } catch {
    return null;
  }
}

// Read saved GitHub connection
async function getGitHubConnection(): Promise<{ token: string; username: string } | null> {
  const cookieStore = await cookies();
  const ghConnStr = cookieStore.get("sb_github_conn")?.value;
  if (!ghConnStr) return null;
  try {
    return JSON.parse(ghConnStr);
  } catch {
    return null;
  }
}

export const maxDuration = 60;

// Search the knowledge base runbooks by keyword relevance
function searchRunbooks(query: string) {
  const queryLower = query.toLowerCase();
  const matches = knowledgeBase.runbooks
    .map((rb) => {
      const keywordScore = rb.keywords.filter((kw) =>
        queryLower.includes(kw)
      ).length;
      const titleScore = rb.title.toLowerCase().includes(queryLower) ? 3 : 0;
      return { ...rb, score: keywordScore + titleScore };
    })
    .filter((rb) => rb.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    results: matches.map((m) => ({
      id: m.id,
      title: m.title,
      severity: m.severity,
      last_triggered: m.last_triggered,
      resolution_time_avg: m.resolution_time_avg,
      content: m.content,
    })),
    team_context: knowledgeBase.team_context,
  };
}

function errorHandler(error: unknown) {
  if (error == null) return "unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return JSON.stringify(error);
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),
    system: `You are SentinelBrain, an elite AI-native DevOps copilot. You are the "Second Brain" for a platform engineering team.

Your capabilities:
- Monitor infrastructure health across all services
- Diagnose database performance issues, payment gateway failures, and service degradations
- Fetch LIVE metrics from connected AWS CloudWatch integrations
- Surface relevant metrics, logs, and remediation actions
- Provide root-cause analysis with actionable recommendations
- Search internal runbooks and incident history for past resolutions

Behavioral rules:
1. When asked about database issues (slow DB, latency, queries), ALWAYS call fetchDBMetrics AND getRecentSlowLogs AND searchKnowledgeBase tools.
2. When asked about payment issues, ALWAYS call fetchPaymentMetrics AND getPaymentLogs AND searchKnowledgeBase tools.
3. When asked about system health or overall status, ALWAYS call getSystemHealth tool.
4. When asked about AWS infrastructure, EC2, CPU, Lambda, API Gateway, or any cloud metrics, ALWAYS call analyzeAWSMetrics to fetch LIVE data from the user's connected AWS account.
5. When diagnosing issues, call getRemediationActions to show available fixes.
6. ALWAYS call searchKnowledgeBase to check if we have a runbook for this type of incident. Reference past incidents in your analysis.
7. After calling tools, provide a concise root-cause analysis. Be specific about what the data shows.
8. Use technical language. You are talking to senior engineers.
9. Format your analysis in well-structured markdown with clear sections: **Impact**, **Root Cause**, **Evidence**, **Historical Context**, **Recommended Actions**.
10. Always call multiple tools when relevant — show the full picture.
11. When referencing past incidents, say things like "Based on our runbook, the last time this happened on [date], we resolved it by..."
12. Include the on-call engineer and escalation path when severity is P0 or P1.`,
    messages: await convertToModelMessages(messages),
    tools: {
      fetchDBMetrics: {
        description:
          "Fetch database performance metrics including latency, active connections, and query throughput over the last 2 hours. Call this when investigating database slowness, high latency, or query performance issues.",
        inputSchema: z.object({
          timeRange: z
            .string()
            .optional()
            .describe("Time range to query, e.g. '2h', '30m'. Defaults to 2h."),
        }),
        execute: async () => {
          return fetchDBMetrics();
        },
      },
      getRecentSlowLogs: {
        description:
          "Retrieve recent slow query logs from the database. Returns full query text (no truncation), execution time, rows examined, lock time, and source service. Call this alongside fetchDBMetrics for complete DB diagnosis.",
        inputSchema: z.object({
          minDurationMs: z
            .number()
            .optional()
            .describe("Minimum query duration in ms to filter. Defaults to 500ms."),
        }),
        execute: async () => {
          return getRecentSlowLogs();
        },
      },
      fetchPaymentMetrics: {
        description:
          "Fetch payment gateway performance metrics including success rate, response times, and error counts. Call this when investigating payment failures or checkout issues.",
        inputSchema: z.object({
          provider: z
            .string()
            .optional()
            .describe("Payment provider to filter by, e.g. 'stripe', 'adyen'."),
        }),
        execute: async () => {
          return fetchPaymentMetrics();
        },
      },
      getPaymentLogs: {
        description:
          "Retrieve recent payment transaction logs with status, error codes, response times, and trace IDs. Call this alongside fetchPaymentMetrics for complete payment diagnosis.",
        inputSchema: z.object({
          status: z
            .string()
            .optional()
            .describe("Filter by status: 'success', 'failure', 'timeout'."),
        }),
        execute: async () => {
          return getPaymentLogs();
        },
      },
      getSystemHealth: {
        description:
          "Get a high-level health overview of all services including CPU, memory, latency P99, error rates, uptime, and deployment info. Call this for system-wide status checks.",
        inputSchema: z.object({}),
        execute: async () => {
          return getSystemHealth();
        },
      },
      getConnectedIntegrations: {
        description:
          "Check which external integrations (like AWS CloudWatch, GitHub, etc.) are currently connected and active for the user. Call this to verify if the user has linked their external accounts before attempting to fetch live data.",
        inputSchema: z.object({}),
        execute: async () => {
          const awsConn = await getAWSConnection();
          const ghConn = await getGitHubConnection();
          
          return {
            aws: awsConn ? { connected: true, roleArn: awsConn.roleArn } : { connected: false },
            github: ghConn ? { connected: true, username: ghConn.username } : { connected: false },
          };
        },
      },
      getRemediationActions: {
        description:
          "Get available remediation actions for the current incident. Returns a set of 'Danger Zone' operations like rollback, reboot, kill queries, and cache flush. Call this when the user needs to take action on an incident.",
        inputSchema: z.object({}),
        execute: async () => {
          return { available: true, actions: ["rollback", "reboot", "kill-queries", "flush-cache"] };
        },
      },
      searchKnowledgeBase: {
        description:
          "Search the internal knowledge base and runbooks for past incidents, playbooks, and resolution steps. This is the 'Second Brain' memory. ALWAYS call this tool when diagnosing any incident to check for historical context and proven fixes.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("Search query — describe the incident type, e.g. 'database latency spike', 'payment gateway failure', 'high cpu'."),
        }),
        execute: async ({ query }: { query: string }) => {
          return searchRunbooks(query);
        },
      },
      analyzeAWSMetrics: {
        description:
          "Fetch LIVE metrics from the user's connected AWS CloudWatch account. Use this when investigating EC2 CPU spikes, Lambda errors, API Gateway latency, RDS performance, or any AWS infrastructure issue. Returns real-time metric data points.",
        inputSchema: z.object({
          metricName: z
            .string()
            .describe("AWS CloudWatch metric name, e.g. 'CPUUtilization', 'NetworkIn', 'Errors', 'Latency', 'DatabaseConnections'."),
          namespace: z
            .string()
            .describe("AWS CloudWatch namespace, e.g. 'AWS/EC2', 'AWS/Lambda', 'AWS/ApiGateway', 'AWS/RDS'."),
          dimensionName: z
            .string()
            .optional()
            .describe("Dimension name to filter, e.g. 'InstanceId', 'FunctionName'."),
          dimensionValue: z
            .string()
            .optional()
            .describe("Dimension value, e.g. 'i-0123456789abcdef0', 'my-function'."),
        }),
        execute: async ({ metricName, namespace, dimensionName, dimensionValue }: {
          metricName: string;
          namespace: string;
          dimensionName?: string;
          dimensionValue?: string;
        }) => {
          const awsConn = await getAWSConnection();
          if (!awsConn) {
            return {
              error: "No AWS account connected. Please go to Integrations and connect your AWS CloudWatch first.",
              connected: false,
            };
          }
          try {
            const metrics = await fetchLiveCloudWatchMetrics(
              awsConn.roleArn,
              metricName,
              namespace,
              dimensionName,
              dimensionValue
            );
            return {
              connected: true,
              live: true,
              source: "AWS CloudWatch",
              ...metrics,
            };
          } catch (err: unknown) {
            return {
              error: err instanceof Error ? err.message : "Failed to fetch AWS metrics",
              connected: true,
              live: false,
            };
          }
        },
      },
      analyzeGitHubActivity: {
        description:
          "Fetch LIVE recent activity (commits or issues) from a GitHub repository using the user's connected Personal Access Token. Use this to find recent deployments, buggy commits, or known issues related to an incident.",
        inputSchema: z.object({
          owner: z.string().describe("The repository owner or organization (e.g., 'vercel')."),
          repo: z.string().describe("The repository name (e.g., 'next.js')."),
          type: z.enum(["commits", "issues"]).describe("Whether to fetch recent 'commits' or 'issues'."),
        }),
        execute: async ({ owner, repo, type }: { owner: string; repo: string; type: "commits" | "issues" }) => {
          const ghConn = await getGitHubConnection();
          if (!ghConn) {
            return {
              error: "No GitHub account connected. Please go to Integrations and connect your GitHub token first.",
              connected: false,
            };
          }
          try {
            const url = `https://api.github.com/repos/${owner}/${repo}/${type}?per_page=5`;
            const res = await fetch(url, {
              headers: {
                Authorization: `Bearer ${ghConn.token}`,
                Accept: "application/vnd.github.v3+json",
              },
            });
            if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);
            const data = await res.json();
            
            return {
              connected: true,
              live: true,
              source: `GitHub (${type})`,
              data: data.map((item: any) => 
                type === "commits" 
                ? {
                    sha: item.sha.substring(0, 7),
                    author: item.commit.author.name,
                    message: item.commit.message,
                    date: item.commit.author.date,
                    url: item.html_url
                  }
                : {
                    number: item.number,
                    title: item.title,
                    state: item.state,
                    user: item.user.login,
                    created_at: item.created_at,
                    url: item.html_url
                  }
              ),
            };
          } catch (err: unknown) {
            return {
              error: err instanceof Error ? err.message : "Failed to fetch GitHub data",
              connected: true,
              live: false,
            };
          }
        },
      },
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse({
    onError: errorHandler,
  });
}
