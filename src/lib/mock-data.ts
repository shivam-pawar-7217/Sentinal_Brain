// ============================================================================
// SentinelBrain — Mock Data Engine
// Simulates real DevOps telemetry for demo purposes.
// Two scenarios: "Database Latency Spike" & "Payment Gateway Failure"
// ============================================================================

export interface MetricPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface SlowLog {
  id: string;
  timestamp: string;
  duration_ms: number;
  query: string;
  source: string;
  rows_examined: number;
  rows_sent: number;
  lock_time_ms: number;
  user: string;
  db: string;
}

export interface SystemHealthData {
  service: string;
  status: "healthy" | "degraded" | "critical";
  uptime: string;
  cpu: number;
  memory: number;
  latency_p99: number;
  error_rate: number;
  last_deploy: string;
  region: string;
}

export interface PaymentGatewayLog {
  id: string;
  timestamp: string;
  status: "success" | "failure" | "timeout";
  provider: string;
  error_code: string | null;
  amount: number;
  currency: string;
  customer_id: string;
  trace_id: string;
  response_time_ms: number;
}

// ============================================================================
// SCENARIO 1: Database Latency Spike
// ============================================================================

function generateTimestamps(count: number, intervalMinutes: number = 5): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getTime() - (count - 1 - i) * intervalMinutes * 60 * 1000);
    return d.toISOString().replace("T", " ").substring(0, 19);
  });
}

export function fetchDBMetrics(): {
  latency: MetricPoint[];
  connections: MetricPoint[];
  throughput: MetricPoint[];
} {
  const timestamps = generateTimestamps(24, 5);

  // Latency: normal ~12ms, spikes to 800ms+ at index 16-20
  const latency: MetricPoint[] = timestamps.map((ts, i) => {
    let value: number;
    if (i < 14) {
      value = 8 + Math.random() * 8; // 8-16ms normal
    } else if (i < 16) {
      value = 20 + Math.random() * 40; // ramp-up
    } else if (i < 21) {
      value = 450 + Math.random() * 400; // SPIKE zone: 450-850ms
    } else {
      value = 200 + Math.random() * 150; // recovering
    }
    return {
      timestamp: ts,
      value: Math.round(value * 100) / 100,
      label: i >= 16 && i < 21 ? "⚠ SPIKE" : undefined,
    };
  });

  // Active connections: normal ~45, spikes to 290+
  const connections: MetricPoint[] = timestamps.map((ts, i) => {
    let value: number;
    if (i < 15) {
      value = 35 + Math.random() * 20;
    } else if (i < 21) {
      value = 220 + Math.random() * 80;
    } else {
      value = 120 + Math.random() * 40;
    }
    return { timestamp: ts, value: Math.round(value) };
  });

  // Throughput (queries/sec): normal ~1200, drops during spike
  const throughput: MetricPoint[] = timestamps.map((ts, i) => {
    let value: number;
    if (i < 15) {
      value = 1100 + Math.random() * 200;
    } else if (i < 21) {
      value = 200 + Math.random() * 150; // dramatically reduced
    } else {
      value = 600 + Math.random() * 200;
    }
    return { timestamp: ts, value: Math.round(value) };
  });

  return { latency, connections, throughput };
}

export function getRecentSlowLogs(): SlowLog[] {
  const now = new Date();
  const queries = [
    {
      query:
        "SELECT o.id, o.created_at, o.total, u.email, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.status = 'pending' AND o.created_at > '2026-01-01' ORDER BY o.created_at DESC LIMIT 500",
      source: "api-gateway/order-service",
      db: "production_orders",
    },
    {
      query:
        "SELECT COUNT(*) as cnt, DATE(created_at) as day FROM transactions WHERE merchant_id IN (SELECT id FROM merchants WHERE tier = 'enterprise') AND created_at BETWEEN '2026-03-01' AND '2026-04-28' GROUP BY DATE(created_at)",
      source: "analytics-worker/daily-rollup",
      db: "production_analytics",
    },
    {
      query:
        "UPDATE inventory SET stock = stock - 1, updated_at = NOW() WHERE product_id = 'SKU-8847291' AND warehouse_id = 'us-east-1-primary' AND stock > 0",
      source: "inventory-service/decrement",
      db: "production_inventory",
    },
    {
      query:
        "SELECT p.*, c.name as category_name, (SELECT AVG(rating) FROM reviews r WHERE r.product_id = p.id) as avg_rating FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1 AND p.price BETWEEN 10.00 AND 500.00 ORDER BY avg_rating DESC",
      source: "search-service/product-ranking",
      db: "production_catalog",
    },
    {
      query:
        "INSERT INTO audit_log (event_type, actor_id, resource_type, resource_id, metadata, ip_address, user_agent, created_at) VALUES ('payment.refund', 'usr_29x8k', 'payment', 'pay_4fn29', '{\"amount\": 149.99, \"reason\": \"customer_request\", \"original_charge\": \"ch_8x92m\"}', '10.0.3.47', 'SentinelBrain/1.0', NOW())",
      source: "audit-service/writer",
      db: "production_audit",
    },
    {
      query:
        "SELECT s.id, s.name, sh.cpu_usage, sh.memory_usage, sh.disk_io, sh.network_in, sh.network_out, sh.error_count FROM services s JOIN service_health sh ON s.id = sh.service_id WHERE sh.recorded_at > NOW() - INTERVAL 5 MINUTE AND (sh.cpu_usage > 80 OR sh.memory_usage > 85 OR sh.error_count > 0)",
      source: "health-monitor/aggregator",
      db: "production_monitoring",
    },
    {
      query:
        "DELETE FROM session_tokens WHERE expires_at < NOW() - INTERVAL 30 DAY AND is_revoked = 0",
      source: "auth-service/token-cleanup",
      db: "production_auth",
    },
    {
      query:
        "SELECT u.id, u.email, SUM(t.amount) as total_spent, COUNT(t.id) as transaction_count, MAX(t.created_at) as last_transaction FROM users u INNER JOIN transactions t ON u.id = t.user_id WHERE t.created_at > NOW() - INTERVAL 90 DAY GROUP BY u.id, u.email HAVING total_spent > 1000 ORDER BY total_spent DESC LIMIT 100",
      source: "crm-service/high-value-customers",
      db: "production_crm",
    },
  ];

  return queries.map((q, i) => ({
    id: `slow_${Date.now()}_${i}`,
    timestamp: new Date(now.getTime() - (queries.length - i) * 32000)
      .toISOString()
      .replace("T", " ")
      .substring(0, 19),
    duration_ms: Math.round(800 + Math.random() * 4200), // 800ms to 5000ms
    query: q.query,
    source: q.source,
    rows_examined: Math.round(50000 + Math.random() * 2000000),
    rows_sent: Math.round(1 + Math.random() * 500),
    lock_time_ms: Math.round(Math.random() * 1200),
    user: ["app_readwrite", "analytics_ro", "replication_user", "admin_ops"][
      Math.floor(Math.random() * 4)
    ],
    db: q.db,
  }));
}

// ============================================================================
// SCENARIO 2: Payment Gateway Failure
// ============================================================================

export function fetchPaymentMetrics(): {
  success_rate: MetricPoint[];
  response_time: MetricPoint[];
  error_count: MetricPoint[];
} {
  const timestamps = generateTimestamps(20, 3);

  const success_rate: MetricPoint[] = timestamps.map((ts, i) => {
    let value: number;
    if (i < 12) {
      value = 98.5 + Math.random() * 1.5; // ~98.5-100%
    } else if (i < 17) {
      value = 20 + Math.random() * 30; // CRASH: 20-50%
    } else {
      value = 65 + Math.random() * 15; // partial recovery
    }
    return {
      timestamp: ts,
      value: Math.round(value * 100) / 100,
      label: i >= 12 && i < 17 ? "🔴 OUTAGE" : undefined,
    };
  });

  const response_time: MetricPoint[] = timestamps.map((ts, i) => {
    let value: number;
    if (i < 12) {
      value = 120 + Math.random() * 80;
    } else if (i < 17) {
      value = 8000 + Math.random() * 22000; // 8-30 seconds
    } else {
      value = 2000 + Math.random() * 3000;
    }
    return { timestamp: ts, value: Math.round(value) };
  });

  const error_count: MetricPoint[] = timestamps.map((ts, i) => {
    let value: number;
    if (i < 12) {
      value = Math.round(Math.random() * 3);
    } else if (i < 17) {
      value = 150 + Math.round(Math.random() * 200);
    } else {
      value = 30 + Math.round(Math.random() * 40);
    }
    return { timestamp: ts, value };
  });

  return { success_rate, response_time, error_count };
}

export function getPaymentLogs(): PaymentGatewayLog[] {
  const now = new Date();
  const entries: PaymentGatewayLog[] = [];
  const providers = ["stripe", "stripe", "stripe", "adyen"];
  const errors = [
    "GATEWAY_TIMEOUT",
    "CONNECTION_REFUSED",
    "SSL_HANDSHAKE_FAILED",
    "RATE_LIMITED",
    "UPSTREAM_502",
    "DNS_RESOLUTION_FAILED",
  ];

  for (let i = 0; i < 15; i++) {
    const isFailing = i >= 8;
    entries.push({
      id: `pay_${Date.now()}_${i}`,
      timestamp: new Date(now.getTime() - (15 - i) * 18000)
        .toISOString()
        .replace("T", " ")
        .substring(0, 19),
      status: isFailing
        ? Math.random() > 0.3
          ? "failure"
          : "timeout"
        : "success",
      provider: providers[Math.floor(Math.random() * providers.length)],
      error_code: isFailing
        ? errors[Math.floor(Math.random() * errors.length)]
        : null,
      amount: Math.round((10 + Math.random() * 490) * 100) / 100,
      currency: "USD",
      customer_id: `cus_${Math.random().toString(36).substring(2, 10)}`,
      trace_id: `trace_${Math.random().toString(36).substring(2, 14)}`,
      response_time_ms: isFailing
        ? Math.round(5000 + Math.random() * 25000)
        : Math.round(80 + Math.random() * 200),
    });
  }

  return entries;
}

// ============================================================================
// SYSTEM HEALTH (used by SystemHealth shard)
// ============================================================================

export function getSystemHealth(): SystemHealthData[] {
  return [
    {
      service: "API Gateway",
      status: "healthy",
      uptime: "99.98%",
      cpu: 34,
      memory: 61,
      latency_p99: 45,
      error_rate: 0.02,
      last_deploy: "2h ago",
      region: "us-east-1",
    },
    {
      service: "PostgreSQL Primary",
      status: "critical",
      uptime: "99.12%",
      cpu: 94,
      memory: 89,
      latency_p99: 847,
      error_rate: 4.7,
      last_deploy: "6d ago",
      region: "us-east-1",
    },
    {
      service: "Redis Cache",
      status: "healthy",
      uptime: "100%",
      cpu: 12,
      memory: 45,
      latency_p99: 2,
      error_rate: 0,
      last_deploy: "14d ago",
      region: "us-east-1",
    },
    {
      service: "Payment Service",
      status: "critical",
      uptime: "87.3%",
      cpu: 78,
      memory: 72,
      latency_p99: 12400,
      error_rate: 52.1,
      last_deploy: "4h ago",
      region: "us-west-2",
    },
    {
      service: "Auth Service",
      status: "healthy",
      uptime: "99.99%",
      cpu: 22,
      memory: 38,
      latency_p99: 18,
      error_rate: 0.01,
      last_deploy: "1d ago",
      region: "us-east-1",
    },
    {
      service: "Search Index",
      status: "degraded",
      uptime: "99.5%",
      cpu: 67,
      memory: 74,
      latency_p99: 320,
      error_rate: 1.2,
      last_deploy: "3d ago",
      region: "eu-west-1",
    },
    {
      service: "Notification Worker",
      status: "healthy",
      uptime: "99.97%",
      cpu: 18,
      memory: 29,
      latency_p99: 85,
      error_rate: 0.05,
      last_deploy: "8h ago",
      region: "us-east-1",
    },
    {
      service: "CDN Edge",
      status: "healthy",
      uptime: "100%",
      cpu: 8,
      memory: 15,
      latency_p99: 6,
      error_rate: 0,
      last_deploy: "30d ago",
      region: "global",
    },
  ];
}
