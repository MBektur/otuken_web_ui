"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Inbox,
  Mail,
  MailOpen,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  RefreshCw,
  Search,
  Filter,
  Zap,
  Volume2,
  Bell,
  Lock,
} from "lucide-react";
import type { ContactMessage } from "@/lib/contact-store";

export function AdminMessagesPanel() {
  const [secret, setSecret] = useState("otuken2026");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchMessages = async (pwd = secret) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contact?secret=${encodeURIComponent(pwd)}`, {
        headers: { "x-admin-secret": pwd },
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMessages(data.messages || []);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleToggleRead = async (id: string, currentRead: boolean) => {
    try {
      const res = await fetch("/api/contact", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ id, isRead: !currentRead }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isRead: !currentRead } : m))
        );
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("بۇ ئۇچۇرنى راستتىنلا ئۆچۈرەمسىز؟")) return;
    try {
      const res = await fetch(`/api/contact?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-secret": secret },
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {}
  };

  const filteredMessages = messages.filter((m) => {
    if (filter === "unread" && m.isRead) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchEmail = m.email.toLowerCase().includes(q);
      const matchSubject = (m.subject || "").toLowerCase().includes(q);
      const matchMsg = m.message.toLowerCase().includes(q);
      return matchName || matchEmail || matchSubject || matchMsg;
    }
    return true;
  });

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="editorial-page-container" dir="rtl">
      {/* Top Admin Navigation Tabs */}
      <nav className="admin-nav-tabs" aria-label="Settings Navigation" style={{ marginBottom: "28px" }}>
        <Link href="/uy/settings" className="admin-tab-btn">
          <Volume2 size={16} />
          <span>پودكاست تەڭشەكلىرى</span>
        </Link>
        <Link href="/uy/settings/cache" className="admin-tab-btn">
          <Zap size={16} />
          <span>تېز ساقلىغۇچ (Cache)</span>
        </Link>
        <Link href="/uy/settings/push" className="admin-tab-btn">
          <Bell size={16} />
          <span>ئۇقتۇرۇش ئەۋەتىش (Push)</span>
        </Link>
        <Link href="/uy/settings/messages" className="admin-tab-btn active">
          <Inbox size={16} />
          <span>كەلگەن ئۇچۇرلار {unreadCount > 0 && `(${unreadCount})`}</span>
        </Link>
      </nav>

      <header className="editorial-header">
        <span className="eyebrow">ئالاقە كىرىش ساندۇقى</span>
        <h1>كەلگەن ئۇچۇرلار ۋە ئىنكاسلار</h1>
        <p>
          تور بېكەت ئوقۇرمەنلىرى تەرىپىدىن «ئالاقىلىشىڭ» بېتىدىن ئەۋەتىلگەن بارلىق خەۋەر ۋە تەكلىپلەر.
        </p>
      </header>

      {!isAuthenticated ? (
        <div className="editorial-card" style={{ maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
          <Lock size={36} style={{ color: "var(--wine)", margin: "0 auto 16px auto" }} />
          <h2>باشقۇرغۇچى پارولى</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchMessages(secret);
            }}
          >
            <input
              type="password"
              className="form-input"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin secret"
              style={{ marginBottom: "16px", textAlign: "center" }}
              required
            />
            <button type="submit" className="btn-submit" style={{ width: "100%" }}>
              كىرىش
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Controls bar */}
          <div
            className="editorial-card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              padding: "16px 20px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                className={`pwa-toast-btn ${filter === "all" ? "primary" : "secondary"}`}
                onClick={() => setFilter("all")}
                style={{ padding: "6px 14px", fontSize: "13px" }}
              >
                بارلىقى ({messages.length})
              </button>
              <button
                type="button"
                className={`pwa-toast-btn ${filter === "unread" ? "primary" : "secondary"}`}
                onClick={() => setFilter("unread")}
                style={{ padding: "6px 14px", fontSize: "13px" }}
              >
                ئوقۇلمىغانلار ({unreadCount})
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="form-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ئىزدەش..."
                  style={{ padding: "8px 12px", width: "200px", fontSize: "14px" }}
                />
              </div>

              <button
                type="button"
                className="pwa-toast-btn secondary"
                onClick={() => fetchMessages()}
                disabled={loading}
                title="يېڭىلاش"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Messages list */}
          {filteredMessages.length === 0 ? (
            <div className="editorial-card" style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)" }}>
              <Inbox size={48} style={{ opacity: 0.3, margin: "0 auto 16px auto" }} />
              <h3>ھېچقانداق ئۇچۇر تېپىلمىدى</h3>
              <p>كەلگەن ئۇچۇرلار بۇ يەردە تىزىپ كۆرسىتىلىدۇ.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredMessages.map((m) => {
                const isExpanded = expandedId === m.id;
                const dateStr = new Date(m.createdAt).toLocaleString("ug-Arab", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <div
                    key={m.id}
                    className="editorial-card"
                    style={{
                      margin: 0,
                      padding: "18px 22px",
                      background: m.isRead ? "#fffdf9" : "rgba(104, 21, 42, 0.03)",
                      borderRight: m.isRead ? "1px solid var(--rule)" : "4px solid var(--wine)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "14px",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setExpandedId(isExpanded ? null : m.id);
                        if (!m.isRead) handleToggleRead(m.id, false);
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                          <span style={{ fontWeight: m.isRead ? "600" : "800", fontSize: "16px", color: "var(--ink)" }}>
                            {m.name}
                          </span>
                          <span style={{ fontSize: "13px", color: "var(--muted)", direction: "ltr" }}>
                            &lt;{m.email}&gt;
                          </span>
                          {!m.isRead && (
                            <span
                              style={{
                                background: "var(--wine)",
                                color: "#fff",
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "1px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              يېڭى
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink)", marginBottom: "4px" }}>
                          {m.subject}
                        </div>

                        {!isExpanded && (
                          <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {m.message}
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>{dateStr}</span>
                        <button
                          type="button"
                          className="pwa-toast-btn secondary"
                          style={{ padding: "6px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRead(m.id, m.isRead);
                          }}
                          title={m.isRead ? "ئوقۇلمىدى دەپ بەلگىلەش" : "ئوقۇلدى دەپ بەلگىلەش"}
                        >
                          {m.isRead ? <Mail size={15} /> : <MailOpen size={15} />}
                        </button>
                        <button
                          type="button"
                          className="pwa-toast-btn secondary"
                          style={{ padding: "6px", color: "#b91c1c" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(m.id);
                          }}
                          title="ئۆچۈرۈش"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div
                        style={{
                          marginTop: "16px",
                          paddingTop: "16px",
                          borderTop: "1px solid var(--wash)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "15.5px",
                            lineHeight: 1.8,
                            color: "var(--ink)",
                            whiteSpace: "pre-wrap",
                            background: "var(--paper)",
                            padding: "16px",
                            borderRadius: "10px",
                          }}
                        >
                          {m.message}
                        </div>
                        <div style={{ marginTop: "12px", display: "flex", gap: "12px" }}>
                          <a
                            href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || "")}`}
                            className="btn-submit"
                            style={{ fontSize: "13px", padding: "8px 16px" }}
                          >
                            <Mail size={14} />
                            <span>جاۋاب قايتۇرۇش (Email Reply)</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

