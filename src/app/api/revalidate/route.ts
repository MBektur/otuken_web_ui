import { NextRequest, NextResponse } from "next/server";
import {
  isValidSecret,
  fetchLatestWordPressStatus,
  revalidateAllPages,
  revalidateSpecificUrl,
  autoSyncModifiedPosts,
  preWarmSite,
} from "@/lib/cache-sync";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let secret = searchParams.get("secret");
  let action = searchParams.get("action") || "sync";
  let targetPath = searchParams.get("path") || searchParams.get("slug") || "";

  // If request is JSON POST, check body for params as well
  if (req.method === "POST" && req.headers.get("content-type")?.includes("application/json")) {
    try {
      const body = await req.json();
      if (body.secret) secret = body.secret;
      if (body.action) action = body.action;
      if (body.path) targetPath = body.path;
      if (body.slug) targetPath = body.slug;
    } catch {
      // ignore json parse error
    }
  }

  // Verify secret
  if (!isValidSecret(secret)) {
    return NextResponse.json(
      { ok: false, error: "ئىناۋەتسىز مەخپىي ئاچقۇچ (Unauthorized: Invalid secret)" },
      { status: 401 }
    );
  }

  try {
    if (action === "status") {
      const status = await fetchLatestWordPressStatus();
      return NextResponse.json(status);
    }

    if (action === "all") {
      const result = await revalidateAllPages();
      return NextResponse.json(result);
    }

    if (action === "warmup" || action === "prewarm") {
      const origin = req.nextUrl.origin;
      const limit = Number(searchParams.get("limit") || 100);
      const result = await preWarmSite(limit, origin);
      return NextResponse.json(result);
    }

    if (action === "single") {
      if (!targetPath) {
        return NextResponse.json(
          { ok: false, error: "يېڭىلاش ئۈچۈن يول ياكى ئۇلانما كىرگۈزۈلمىدى (Missing path)" },
          { status: 400 }
        );
      }
      const result = await revalidateSpecificUrl(targetPath);
      return NextResponse.json(result);
    }

    // Default action: auto sync recently modified posts
    const result = await autoSyncModifiedPosts();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "ئىچكى خاتالىق يۈز بەردى" },
      { status: 500 }
    );
  }
}
