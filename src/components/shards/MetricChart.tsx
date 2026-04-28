"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, ComposedChart,
} from "recharts";
import type { MetricPoint } from "@/lib/mock-data";

interface MetricChartProps {
  title: string;
  data: MetricPoint[];
  color?: string;
  unit?: string;
  thresholdValue?: number;
  thresholdLabel?: string;
}

export function MetricChart({
  title, data, color = "#6366f1", unit = "ms",
  thresholdValue, thresholdLabel,
}: MetricChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value));
  const hasSpike = data.some((d) => d.label);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0d1117] to-[#161b22] p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-slate-200">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {data.length} data points · max {maxVal.toLocaleString()}{unit}
          </p>
        </div>
        {hasSpike && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            Anomaly Detected
          </span>
        )}
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="timestamp" tick={{ fontSize: 10, fill: "#475569" }}
              tickFormatter={(v: string) => v.split(" ")[1]?.substring(0, 5) || v}
              axisLine={{ stroke: "#1e293b" }} tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a", border: "1px solid #1e293b",
                borderRadius: "8px", fontSize: "12px", color: "#e2e8f0",
              }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value) => [`${Number(value).toLocaleString()} ${unit}`, title]}
            />
            <Area
              type="monotone" dataKey="value"
              fill={`url(#grad-${title.replace(/\s/g, "")})`}
              stroke="none"
            />
            <Line
              type="monotone" dataKey="value" stroke={color}
              strokeWidth={2} dot={false} activeDot={{ r: 4, fill: color }}
            />
            {thresholdValue && (
              <ReferenceLine
                y={thresholdValue} stroke="#ef4444" strokeDasharray="6 4"
                label={{ value: thresholdLabel || "Threshold", fill: "#ef4444", fontSize: 10, position: "right" }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
