import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function getGitHubCookie() {
  const cookieStore = await cookies();
  const ghConnStr = cookieStore.get("sb_github_conn")?.value;
  if (!ghConnStr) return null;
  try {
    return JSON.parse(ghConnStr);
  } catch {
    return null;
  }
}

// GET — Return current GitHub connection status
export async function GET() {
  const gh = await getGitHubCookie();
  return NextResponse.json({
    connected: !!gh,
    username: gh?.username || null,
    connectedAt: gh?.connectedAt || null,
  });
}

// POST — Save Token and test connection
export async function POST(req: Request) {
  const body = await req.json();
  const { token } = body;

  if (!token || (!token.startsWith("ghp_") && !token.startsWith("github_pat_"))) {
    return NextResponse.json(
      { error: "Invalid GitHub Personal Access Token format." },
      { status: 400 }
    );
  }

  // Test the connection
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "GitHub API rejected the token. Ensure it is valid and has repo read permissions." },
        { status: 401 }
      );
    }

    const userData = await res.json();

    // Save the connection in a cookie
    const ghData = {
      token,
      username: userData.login,
      connectedAt: new Date().toISOString(),
    };
    
    const cookieStore = await cookies();
    cookieStore.set("sb_github_conn", JSON.stringify(ghData), { path: "/", maxAge: 60 * 60 * 24 * 30 });

    return NextResponse.json({
      success: true,
      message: "GitHub connected successfully",
      username: userData.login,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Network error connecting to GitHub." },
      { status: 500 }
    );
  }
}

// DELETE — Remove the connection
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("sb_github_conn");
  return NextResponse.json({ success: true });
}
