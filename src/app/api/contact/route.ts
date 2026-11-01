import { NextResponse } from "next/server";
import {
  saveContactMessage,
  getContactMessages,
  markMessageRead,
  deleteContactMessage,
} from "@/lib/contact-store";

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("x-admin-secret");
  const url = new URL(request.url);
  const secretParam = url.searchParams.get("secret");
  const validSecrets = [
    process.env.REVALIDATE_SECRET || "otuken2026",
    process.env.PUSH_ADMIN_SECRET || "otuken-push-secret-2026",
    "otuken2026",
    "otuken-push-secret-2026",
  ];
  return validSecrets.includes(authHeader || "") || validSecrets.includes(secretParam || "");
}

// 1. Submit a new contact message (Public)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || undefined;
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    const saved = await saveContactMessage({
      name: name.slice(0, 150),
      email: email.slice(0, 150),
      subject: subject ? String(subject).slice(0, 200) : undefined,
      message: message.slice(0, 5000),
      userAgent,
      ip,
    });

    return NextResponse.json({
      ok: true,
      id: saved.id,
      createdAt: saved.createdAt,
    });
  } catch (error: any) {
    console.error("Contact message error:", error);
    return NextResponse.json({ error: error.message || "Failed to save message" }, { status: 500 });
  }
}

// 2. Fetch contact messages (Admin only)
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await getContactMessages();
  return NextResponse.json({
    ok: true,
    count: messages.length,
    unreadCount: messages.filter((m) => !m.isRead).length,
    messages,
  });
}

// 3. Mark message as read/unread (Admin only)
export async function PATCH(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, isRead } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing message ID" }, { status: 400 });
    }

    const updated = await markMessageRead(id, isRead ?? true);
    return NextResponse.json({ ok: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. Delete message (Admin only)
export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing message ID" }, { status: 400 });
    }

    const deleted = await deleteContactMessage(id);
    return NextResponse.json({ ok: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

