import test from "node:test";
import assert from "node:assert/strict";
import {
  saveContactMessage,
  getContactMessages,
  markMessageRead,
  deleteContactMessage,
} from "../src/lib/contact-store";

test("Contact message store saves, reads, marks read, and deletes messages correctly", async () => {
  const initialMessages = await getContactMessages();

  // 1. Save new test message
  const saved = await saveContactMessage({
    name: "مۇھەممەد سىناق",
    email: "test@example.com",
    subject: "تەكلىپ پىكىر سىنىقى",
    message: "بۇ بىر ئاپتوماتىك سىناق ئۇچۇرىدۇر.",
  });

  assert.ok(saved.id.startsWith("msg_"));
  assert.equal(saved.name, "مۇھەممەد سىناق");
  assert.equal(saved.isRead, false);

  const messagesAfterAdd = await getContactMessages();
  assert.equal(messagesAfterAdd.length, initialMessages.length + 1);

  // 2. Mark as read
  const marked = await markMessageRead(saved.id, true);
  assert.equal(marked, true);

  const messagesAfterMark = await getContactMessages();
  const target = messagesAfterMark.find((m) => m.id === saved.id);
  assert.equal(target?.isRead, true);

  // 3. Delete message
  const deleted = await deleteContactMessage(saved.id);
  assert.equal(deleted, true);

  const messagesAfterDelete = await getContactMessages();
  assert.equal(messagesAfterDelete.length, initialMessages.length);
});

