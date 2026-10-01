import { NextRequest, NextResponse } from "next/server";
import { autoSyncModifiedPosts } from "@/lib/cache-sync";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // If CRON_SECRET is configured in environment, verify authorization header
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized cron call" }, { status: 401 });
  }

  try {
    const result = await autoSyncModifiedPosts();
    return NextResponse.json({
      cron: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Cron sync error" },
      { status: 500 }
    );
  }
}
