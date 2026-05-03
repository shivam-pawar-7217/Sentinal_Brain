import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { testAWSConnection } from "@/lib/aws";

const CONNECTIONS_PATH = join(process.cwd(), "data", "connections.json");

function readConnections() {
  try {
    return JSON.parse(readFileSync(CONNECTIONS_PATH, "utf-8"));
  } catch {
    return { aws: null };
  }
}

function writeConnections(data: Record<string, unknown>) {
  writeFileSync(CONNECTIONS_PATH, JSON.stringify(data, null, 2));
}

// GET — Return current AWS connection status
export async function GET() {
  const connections = readConnections();
  return NextResponse.json({
    connected: !!connections.aws,
    roleArn: connections.aws?.roleArn || null,
    region: connections.aws?.region || null,
    connectedAt: connections.aws?.connectedAt || null,
  });
}

// POST — Save ARN and optionally test connection
export async function POST(req: Request) {
  const body = await req.json();
  const { roleArn, region, testOnly } = body;

  if (!roleArn || !roleArn.startsWith("arn:aws:iam::")) {
    // Allow both arn:aws:iam:: formats
    if (!roleArn?.match(/^arn:aws:iam::\d{12}:role\/.+$/)) {
      return NextResponse.json(
        { error: "Invalid IAM Role ARN format. Expected: arn:aws:iam::<account-id>:role/<role-name>" },
        { status: 400 }
      );
    }
  }

  // Test the connection
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    const testResult = await testAWSConnection(roleArn);
    if (!testResult.success) {
      return NextResponse.json(
        { error: `Connection failed: ${testResult.error}`, tested: true },
        { status: 400 }
      );
    }

    if (testOnly) {
      return NextResponse.json({
        success: true,
        accountId: testResult.accountId,
        message: "Connection test passed",
      });
    }
  }

  // Save the connection
  const connections = readConnections();
  connections.aws = {
    roleArn,
    region: region || process.env.AWS_REGION || "us-east-1",
    connectedAt: new Date().toISOString(),
  };
  writeConnections(connections);

  return NextResponse.json({
    success: true,
    message: "AWS CloudWatch connected successfully",
  });
}

// DELETE — Remove the connection
export async function DELETE() {
  const connections = readConnections();
  connections.aws = null;
  writeConnections(connections);
  return NextResponse.json({ success: true });
}
