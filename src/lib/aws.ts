import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import {
  CloudWatchClient,
  GetMetricDataCommand,
  type MetricDataQuery,
} from "@aws-sdk/client-cloudwatch";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AWSMetricPoint {
  time: string;
  value: number;
  label?: string;
}

export interface AWSMetricResult {
  metricName: string;
  namespace: string;
  dataPoints: AWSMetricPoint[];
  unit: string;
  period: string;
}

// ─── STS: Assume Role ─────────────────────────────────────────────────────────

async function assumeRole(roleArn: string) {
  const sts = new STSClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: `sentinelbrain-${Date.now()}`,
    DurationSeconds: 900, // 15 minutes — minimum allowed
  });

  const response = await sts.send(command);

  if (!response.Credentials) {
    throw new Error("STS AssumeRole returned no credentials");
  }

  return {
    accessKeyId: response.Credentials.AccessKeyId!,
    secretAccessKey: response.Credentials.SecretAccessKey!,
    sessionToken: response.Credentials.SessionToken!,
  };
}

// ─── CloudWatch: Fetch Live Metrics ───────────────────────────────────────────

export async function fetchLiveCloudWatchMetrics(
  roleArn: string,
  metricName: string,
  namespace: string,
  dimensionName?: string,
  dimensionValue?: string
): Promise<AWSMetricResult> {
  // Step 1: Assume the customer's role
  const tempCreds = await assumeRole(roleArn);

  // Step 2: Create CloudWatch client with temp credentials
  const cw = new CloudWatchClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: tempCreds.accessKeyId,
      secretAccessKey: tempCreds.secretAccessKey,
      sessionToken: tempCreds.sessionToken,
    },
  });

  // Step 3: Build the metric query
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const dimensions =
    dimensionName && dimensionValue
      ? [{ Name: dimensionName, Value: dimensionValue }]
      : undefined;

  const queries: MetricDataQuery[] = [
    {
      Id: "m1",
      MetricStat: {
        Metric: {
          Namespace: namespace,
          MetricName: metricName,
          Dimensions: dimensions,
        },
        Period: 300, // 5-minute intervals
        Stat: "Average",
      },
      ReturnData: true,
    },
  ];

  // Step 4: Execute the query
  const command = new GetMetricDataCommand({
    MetricDataQueries: queries,
    StartTime: oneHourAgo,
    EndTime: now,
  });

  const response = await cw.send(command);

  // Step 5: Transform into our standard format
  const result = response.MetricDataResults?.[0];
  const dataPoints: AWSMetricPoint[] = [];

  if (result?.Timestamps && result?.Values) {
    // CloudWatch returns in reverse chronological order — sort ascending
    const pairs = result.Timestamps.map((ts, i) => ({
      time: ts.toISOString(),
      value: Math.round((result.Values![i] ?? 0) * 100) / 100,
      label: metricName,
    }));
    pairs.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    dataPoints.push(...pairs);
  }

  return {
    metricName,
    namespace,
    dataPoints,
    unit: result?.Label || metricName,
    period: "Last 1 hour (5m intervals)",
  };
}

// ─── Test Connection (STS only) ───────────────────────────────────────────────

export async function testAWSConnection(roleArn: string): Promise<{
  success: boolean;
  accountId?: string;
  error?: string;
}> {
  try {
    const sts = new STSClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const response = await sts.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: `sentinelbrain-test-${Date.now()}`,
        DurationSeconds: 900,
      })
    );

    return {
      success: true,
      accountId: response.AssumedRoleUser?.Arn?.split(":")[4],
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
