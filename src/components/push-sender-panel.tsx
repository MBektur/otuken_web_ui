"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Bell, Users, CheckCircle2, AlertCircle, RefreshCw, Smartphone, Volume2, Zap, Inbox } from "lucide-react";
import type { WPPost } from "@/lib/wordpress";
import { plainText, localPath } from "@/lib/content";

export function PushSenderPanel({ posts = [] }: { posts?: WPPost[] }) {
  const [subCount, setSubCount] = useState<number | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/uy");
  const [secret, setSecret] = useState("otuken-push-secret-2026");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/push/status");
      const data = await res.json();
      if (data.ok) {
        setSubCount(data.subscriberCount);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handlePostSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPostId(id);
    if (!id) return;

    const post = posts.find((p) => String(p.id) === id);
    if (post) {
      const cleanTitle = plainText(post.title.rendered);
      const cleanExcerpt = plainText(post.excerpt?.rendered || post.content?.rendered || "").slice(0, 120);
      setTitle(cleanTitle);
      setBody(cleanExcerpt ? `${cleanExcerpt}...` : "ئۆتۈكەندە يېڭى ئانالىز ماقالىسى ئېلان قىلىندى.");
      setUrl(localPath(post.link));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("تېما ۋە مەزمۇن قۇرۇق قالسا بولمايدۇ.");
      return;
    }

    setSending(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({
          title,
          body,
          url,
          secret,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setResult(data.result);
        fetchStatus();
      } else {
        setError(data.error || "ئۇقتۇرۇش ئەۋەتىش مەغلۇپ بولدى.");
      }
    } catch (err: any) {
      setError(err.message || "تور خاتالىقى كۆرۈلدى.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="editorial-page-container" dir="rtl">
      {/* Top Admin Navigation Tabs */}
      <nav className="admin-nav-tabs" aria-label="Admin Navigation" style={{ marginBottom: "28px" }}>
        <Link href="/uy/admin/settings" className="admin-tab-btn">
          <Volume2 size={16} />
          <span>پودكاست تەڭشەكلىرى</span>
        </Link>
        <Link href="/uy/admin/cache" className="admin-tab-btn">
          <Zap size={16} />
          <span>تېز ساقلىغۇچ (Cache)</span>
        </Link>
        <Link href="/uy/admin/push" className="admin-tab-btn active">
          <Bell size={16} />
          <span>ئۇقتۇرۇش ئەۋەتىش (Push)</span>
        </Link>
        <Link href="/uy/admin/messages" className="admin-tab-btn">
          <Inbox size={16} />
          <span>كەلگەن ئۇچۇرلار</span>
        </Link>
      </nav>

      <header className="editorial-header">
        <span className="eyebrow">ئۇچۇر تارقىتىش سۇپىسى</span>
        <h1>ئەپلەرگە يىراقتىن ئۇقتۇرۇش ئەۋەتىش (Web Push)</h1>
        <p>
          ئۆتۈكەن ئەپىنى يانفون ياكى كومپيۇتېرىغا قاچىلىغان ۋە ئۇقتۇرۇشنى قوزغاتقان بارلىق ئوقۇرمەنلەرگە يېڭى ماقالىلەرنى دەرھال ئەۋەتىڭ.
        </p>
      </header>

      {/* Subscriber stats card */}
      <div
        className="editorial-card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          background: "linear-gradient(135deg, rgba(104,21,42,0.05), rgba(244,180,26,0.05))",
          borderColor: "var(--rule)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "var(--wine)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={24} />
          </div>
          <div>
            <div style={{ fontSize: "14px", color: "var(--muted)" }}>ئاكتىپ ئەپ ئابۇنتلىرى (Subscribers)</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--ink)", lineHeight: 1.1 }}>
              {subCount === null ? "..." : `${subCount} ئۈسكۈنە`}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="pwa-toast-btn secondary"
          onClick={fetchStatus}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={14} />
          <span>يېڭىلاش</span>
        </button>
      </div>

      {result && (
        <div
          className="editorial-card"
          style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            color: "#166534",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <CheckCircle2 size={22} />
            <strong style={{ fontSize: "16px" }}>ئۇقتۇرۇش مۇۋەپپەقىيەتلىك يوللاندى!</strong>
          </div>
          <div style={{ fontSize: "14px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <span>جەمئىي نىشان: <b>{result.total}</b></span>
            <span>يەتكۈزۈلگىنى: <b>{result.sent}</b></span>
            <span>مەغلۇپ بولغىنى: <b>{result.failed}</b></span>
            {result.pruned > 0 && <span>تازالانغان كونىراپ كەتكەن ئۈسكۈنە: <b>{result.pruned}</b></span>}
          </div>
        </div>
      )}

      {error && (
        <div
          className="editorial-card"
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          <AlertCircle size={22} />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSend} className="editorial-card">
        <h2>ئۇقتۇرۇش يوللاش فامىلىسى</h2>

        {posts.length > 0 && (
          <div className="form-group">
            <label htmlFor="post-select">يېڭى ئېلان قىلىنغان يازمىدىن تاللاش:</label>
            <select
              id="post-select"
              className="form-input"
              value={selectedPostId}
              onChange={handlePostSelect}
            >
              <option value="">-- يازمىنى تاللاڭ (ئاپتوماتىك تولدۇرۇلىدۇ) --</option>
              {posts.map((post) => (
                <option key={post.id} value={post.id}>
                  {plainText(post.title.rendered)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="push-title">ئۇقتۇرۇش ماۋزۇسى *</label>
          <input
            id="push-title"
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مەسىلەن: يېڭى ئانالىز — خەلقئارا تەڭپۇڭلۇق ۋە كەلگۈسى"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="push-body">ئۇقتۇرۇش مەزمۇنى (قىسقىچە بايان) *</label>
          <textarea
            id="push-body"
            className="form-textarea"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="مەسىلەن: مەركىزىمىزنىڭ يېڭى تەتقىقات ماقالىسى تور بېتىمىزدە تولۇق ئېلان قىلىندى..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="push-url">چېكىلگەندە ئېچىلىدىغان ئۇلىنىش (URL)</label>
          <input
            id="push-url"
            type="text"
            dir="ltr"
            className="form-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/uy/post-slug"
          />
        </div>

        <div className="form-group">
          <label htmlFor="push-secret">باشقۇرغۇچى مەخپىي ئاچقۇچى (Admin Secret)</label>
          <input
            id="push-secret"
            type="password"
            dir="ltr"
            className="form-input"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Secret key"
          />
        </div>

        <button
          type="submit"
          className="btn-submit"
          disabled={sending}
          style={{ width: "100%", padding: "14px", fontSize: "16px" }}
        >
          <Send size={18} />
          <span>{sending ? "ئەۋەتىلىۋاتىدۇ..." : "ئۇقتۇرۇشنى بارلىق ئوقۇرمەنلەرگە يوللاش"}</span>
        </button>
      </form>
    </div>
  );
}

