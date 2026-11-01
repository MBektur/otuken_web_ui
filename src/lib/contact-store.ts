import fs from "node:fs/promises";
import path from "node:path";

export interface ContactMessage {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead: boolean;
  userAgent?: string;
  ip?: string;
}

const DATA_DIR = path.resolve(process.cwd(), "src/data");
const MESSAGES_FILE = path.join(DATA_DIR, "contact-messages.json");

let memoryMessages: ContactMessage[] | null = null;

async function loadMessages(): Promise<ContactMessage[]> {
  if (memoryMessages !== null) return memoryMessages;
  try {
    const raw = await fs.readFile(MESSAGES_FILE, "utf8");
    memoryMessages = JSON.parse(raw);
    return memoryMessages || [];
  } catch {
    memoryMessages = [];
    return memoryMessages;
  }
}

async function persistMessages(messages: ContactMessage[]): Promise<void> {
  memoryMessages = messages;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist contact messages:", err);
  }
}

export async function saveContactMessage(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  userAgent?: string;
  ip?: string;
}): Promise<ContactMessage> {
  const messages = await loadMessages();
  const newMessage: ContactMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    name: data.name.trim(),
    email: data.email.trim(),
    subject: data.subject?.trim() || "تېمىسىز ئۇچۇر (No Subject)",
    message: data.message.trim(),
    isRead: false,
    userAgent: data.userAgent,
    ip: data.ip,
  };

  messages.unshift(newMessage);
  await persistMessages(messages);
  return newMessage;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const messages = await loadMessages();
  return [...messages];
}

export async function markMessageRead(id: string, isRead = true): Promise<boolean> {
  const messages = await loadMessages();
  const index = messages.findIndex((m) => m.id === id);
  if (index >= 0) {
    messages[index].isRead = isRead;
    await persistMessages(messages);
    return true;
  }
  return false;
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const messages = await loadMessages();
  const filtered = messages.filter((m) => m.id !== id);
  if (filtered.length !== messages.length) {
    await persistMessages(filtered);
    return true;
  }
  return false;
}
