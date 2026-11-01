import { NextResponse } from "next/server";
import { broadcastNotification } from "@/lib/push-store";
import { PUSH_ADMIN_SECRET } from "@/lib/push-config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, body: desc, url, secret } = body;

    // Check authorization secret
    const authHeader = request.headers.get("x-admin-secret");
    if (secret !== PUSH_ADMIN_SECRET && authHeader !== PUSH_ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notificationTitle = title?.trim();
    const notificationBody = (desc || message || "").trim();

    if (!notificationTitle || !notificationBody) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    const result = await broadcastNotification({
      title: notificationTitle,
      body: notificationBody,
      url: url || "/uy",
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error: any) {
    console.error("Push broadcast error:", error);
    return NextResponse.json(
      { error: error.message || "Broadcast error" },
      { status: 500 }
    );
  }
}

