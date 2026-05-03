import { NextResponse } from "next/server";
import { testAWSConnection } from "@/lib/aws";
import { cookies } from "next/headers";

function getAWSCookie() {
  const awsConnStr = cookies().get("sb_aws_conn")?.value;
  if (!awsConnStr) return null;
  try {
    return JSON.parse(awsConnStr);
  } catch {
    return null;
  }
}

// GET — Return current AWS connection status
export async function GET() {
  const aws = getAWSCookie();
  return NextResponse.json({
    connected: !!aws,
    roleArn: aws?.roleArn || null,
    region: aws?.region || null,
    connectedAt: aws?.connectedAt || null,
  });
}

// POST — Save ARN and optionally test connection
export async function POST(req: Request) {
  const body = await req.json();
  const { roleArn, region, testOnly } = body;

  if (!roleArn || !roleArn.startsWith("arn:aws:iam::")) {
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

  // Save the connection in a cookie
  const awsData = {
    roleArn,
    region: region || process.env.AWS_REGION || "us-east-1",
    connectedAt: new Date().toISOString(),
  };
  cookies().set("sb_aws_conn", JSON.stringify(awsData), { path: "/", maxAge: 60 * 60 * 24 * 30 });

  return NextResponse.json({
    success: true,
    message: "AWS CloudWatch connected successfully",
  });
}

// DELETE — Remove the connection
export async function DELETE() {
  cookies().delete("sb_aws_conn");
  return NextResponse.json({ success: true });
}
