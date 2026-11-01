import { NextResponse } from "next/server";
import { addSubscription, removeSubscription } from "@/lib/push-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, action } = body;

    if (action === "unsubscribe") {
      const endpoint = subscription?.endpoint || body.endpoint;
      if (!endpoint) {
        return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
      }
      const res = await removeSubscription(endpoint);
      return NextResponse.json({ ok: true, removed: res.removed, total: res.total });
    }

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Invalid subscription payload" },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || undefined;
    const res = await addSubscription({
      ...subscription,
      userAgent,
    });

    return NextResponse.json({ ok: true, added: res.added, total: res.total });
  } catch (error: any) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

