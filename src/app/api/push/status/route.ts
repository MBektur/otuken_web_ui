import { NextResponse } from "next/server";
import { getSubscriptionCount } from "@/lib/push-store";
import { VAPID_PUBLIC_KEY } from "@/lib/push-config";

export async function GET() {
  const count = await getSubscriptionCount();
  return NextResponse.json({
    ok: true,
    subscriberCount: count,
    publicKey: VAPID_PUBLIC_KEY,
  });
}

