"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  RefreshCw,
  Zap,
  Globe2,
  FileText,
  Clock3,
  Copy,
  Check,
  Radio,
  ExternalLink,
  Lock,
  ArrowLeft,
  Volume2,
  Terminal,
  Flame,
  Image as ImageIcon,
  Bell,
  Inbox,
} from "lucide-react";

interface SyncStatus {
  ok: boolean;
  totalPosts: number;
  latestModified: string;
  latestTitle: string;
  recentPosts: Array<{
    id: number;
    title: string;
    modified: string;
    link: string;
  }>;
}

interface LogEntry {
  id: string;
  time: string;
  text: string;
  type: "success" | "error" | "info";
}

export function CacheManager() {
  const [secret, setSecret] = useState("otuken2026");
  const [inputSecret, setInputSecret] = useState("otuken2026");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [singlePath, setSinglePath] = useState("");
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "init",
      time: "--:--:--",
      text: "باشقۇرۇش سىستېمىسى تەييارلاندى. مەخپىي ئاچقۇچ بىلەن ئۇلانسىڭىز بولىدۇ.",
      type: "info",
    },
  ]);

  function addLog(text: string, type: "success" | "error" | "info" = "info") {
    const entry: LogEntry = {
      id: Math.random().toString(36).slice(2),
      time: new Date().toLocaleTimeString(),
      text,
      type,
    };
    setLogs(prev => [entry, ...prev.slice(0, 40)]);
  }

  const [origin, setOrigin] = useState("https://otuken-policy-center.vercel.app");

  // Check stored secret on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      setLogs([
        {
          id: "init",
          time: new Date().toLocaleTimeString(),
          text: "باشقۇرۇش سىستېمىسى تەييارلاندى. مەخپىي ئاچقۇچ بىلەن ئۇلانسىڭىز بولىدۇ.",
          type: "info",
        },
      ]);
    }
    const saved = sessionStorage.getItem("otuken_cache_secret");
    if (saved) {
      setSecret(saved);
      setInputSecret(saved);
      checkAuth(saved);
    } else {
      checkAuth("otuken2026");
    }
  }, []);

  async function checkAuth(keyToTest: string) {
    setLoadingAction("auth");
    try {
      const res = await fetch(`/api/revalidate?secret=${encodeURIComponent(keyToTest)}&action=status`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setIsAuthenticated(true);
        setSecret(keyToTest);
        sessionStorage.setItem("otuken_cache_secret", keyToTest);
        setStatus(data);
        addLog(`✅ سالاھىيەت دەلىللەندى. WordPress تىن ${data.totalPosts} يازما بايقالدى.`, "success");
      } else {
        setIsAuthenticated(false);
        addLog(`❌ مەخپىي ئاچقۇچ خاتا ياكى ئىناۋەتسىز.`, "error");
      }
    } catch (err: any) {
      setIsAuthenticated(false);
      addLog(`❌ ئۇلىنىش مەغلۇپ بولدى: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleAction(action: "all" | "sync" | "home" | "podcasts" | "warmup" | "warm-images") {
    setLoadingAction(action);
    const start = performance.now();
    addLog(`⏳ ${action.toUpperCase()} يېڭىلاش / قىزىتىش مەشغۇلاتى يوللاندى...`, "info");

    try {
      let endpoint = `/api/revalidate?secret=${encodeURIComponent(secret)}`;
      if (action === "all") endpoint += "&action=all";
      else if (action === "sync") endpoint += "&action=sync";
      else if (action === "warmup") endpoint += "&action=warmup&limit=100";
      else if (action === "warm-images") endpoint += "&action=warm-images&limit=50";
      else if (action === "home") endpoint += "&action=single&path=/uy";
      else if (action === "podcasts") endpoint += "&action=single&path=/uy/podcasts";

      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);

      if (res.ok && data.ok) {
        addLog(`✅ مۇۋەپپەقىيەتلىك تامام (${elapsed}ms): ${data.message || "تېز خاتىرە يېڭىلاندى"}`, "success");
        if (data.sampleUrls?.length) {
          addLog(`⚡ قىزىتىلغان تاللانما رەسىملەر: ${data.sampleUrls.slice(0, 3).join(", ")}...`, "info");
        } else if (data.samplePaths?.length) {
          addLog(`⚡ قىزىتىلغان تاللانما بەتلەر: ${data.samplePaths.slice(0, 5).join(", ")}...`, "info");
        }
        if (action === "sync" || action === "all" || action === "warmup" || action === "warm-images") {
          refreshStatus();
        }
      } else {
        addLog(`❌ خاتالىق كۆرۈلدى (${elapsed}ms): ${data.error || "نامەلۇم خاتالىق"}`, "error");
      }
    } catch (err: any) {
      addLog(`❌ تور ياكى سىستېما خاتالىقى: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!singlePath.trim()) return;

    setLoadingAction("single");
    const start = performance.now();
    addLog(`⏳ «${singlePath}» نى يېڭىلاش يوللاندى...`, "info");

    try {
      const res = await fetch(`/api/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          action: "single",
          path: singlePath.trim(),
        }),
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);

      if (res.ok && data.ok) {
        addLog(`✅ تامام (${elapsed}ms): ${data.message}`, "success");
        setSinglePath("");
      } else {
        addLog(`❌ مەغلۇپ بولدى (${elapsed}ms): ${data.error || "نامەلۇم خاتالىق"}`, "error");
      }
    } catch (err: any) {
      addLog(`❌ خاتالىق: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function refreshStatus() {
    try {
      const res = await fetch(`/api/revalidate?secret=${encodeURIComponent(secret)}&action=status`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus(data);
      }
    } catch {
      // ignore
    }
  }

  const webhookUrl = `${origin}/api/revalidate?secret=${secret}`;

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    addLog(`📋 Webhook ئۇلانمىسى كۆچۈرۈلدى.`, "info");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="cache-admin-container">
      {/* Top Admin Navigation Tabs */}
      <nav className="admin-nav-tabs" aria-label="Settings Navigation">
        <Link
          href="/uy/settings"
          className="admin-tab-btn"
        >
          <Volume2 size={16} />
          <span>پودكاست ۋە سىن تەڭشەكلىرى</span>
        </Link>
        <Link
          href="/uy/settings/cache"
          className="admin-tab-btn active"
        >
          <Zap size={16} />
          <span>تېز ساقلىغۇچ ۋە ماسقەدەملەش</span>
        </Link>
        <Link
          href="/uy/settings/push"
          className="admin-tab-btn"
        >
          <Bell size={16} />
          <span>ئۇقتۇرۇش ئەۋەتىش (Web Push)</span>
        </Link>
        <Link
          href="/uy/settings/messages"
          className="admin-tab-btn"
        >
          <Inbox size={16} />
          <span>كەلگەن ئۇچۇرلار</span>
        </Link>
      </nav>

      {/* Top Banner */}
      <header className="cache-admin-header">
        <div className="cache-admin-title">
          <div className="cache-icon-box">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1>تېز خاتىرە ئەسلىمىسى ۋە يېڭىلاش مەركىزى</h1>
            <p>Vercel Edge ISR، ئارقا پىلان تەكشۈرۈش ۋە دەرھال ئۆچۈرۈپ قايتا يېڭىلاش سىستېمىسى</p>
          </div>
        </div>

        <div className="cache-auth-bar">
          <div className="cache-input-group">
            <Lock size={15} />
            <input
              type="password"
              value={inputSecret}
              onChange={e => setInputSecret(e.target.value)}
              placeholder="مەخپىي ئاچقۇچ (Secret Key)..."
              dir="ltr"
            />
            <button
              type="button"
              className="btn-auth-save"
              onClick={() => checkAuth(inputSecret)}
              disabled={loadingAction === "auth"}
            >
              {loadingAction === "auth" ? "تەكشۈرۈۋاتىدۇ..." : "دەلىللەش"}
            </button>
          </div>
          <span className={`status-pill ${isAuthenticated ? "online" : "offline"}`}>
            <span className="dot" />
            {isAuthenticated ? "ئاكتىپ / رۇخسەتلىك" : "كىرىلمىدى"}
          </span>
        </div>
      </header>

      {/* Metrics Row */}
      <section className="cache-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon wp">
            <Globe2 size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">WordPress ئەھۋالى</span>
            <strong className="metric-value">{status?.ok ? "ئۇلانغان (Online)" : "كۈتۈلمەكتە..."}</strong>
            <small>otukenpolicycenter.com</small>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon posts">
            <FileText size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">جەمئىي يازمىلار</span>
            <strong className="metric-value" dir="ltr">
              {status ? status.totalPosts : "..."}
            </strong>
            <small>ئېلان قىلىنغان مەزمۇن سانى</small>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon clock">
            <Clock3 size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">ئەڭ يېڭى ئۆزگەرتىش</span>
            <strong className="metric-value metric-date" dir="ltr">
              {status?.latestModified ? status.latestModified.replace("T", " ") : "تېپىلمىدى"}
            </strong>
            <small>WordPress تىكى تەھرىر ۋاقتى</small>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon latest">
            <Radio size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">ئەڭ يېڭى يازما</span>
            <strong className="metric-value metric-title">
              {status?.latestTitle || "تېپىلمىدى"}
            </strong>
            <small>ئاخىرقى مەزمۇن</small>
          </div>
        </div>
      </section>

      {/* Actions Section */}
      <section className="cache-actions-section">
        <div className="section-title-wrap">
          <h2>تېز سۈرئەتلىك يېڭىلاش مەشغۇلاتلىرى</h2>
          <p>تۆۋەندىكى كۇنۇپكىلار بىلەن Vercel نىڭ Edge تېز خاتىرەنى دەرھال بوشىتىپ يېڭىلىيالايسىز.</p>
        </div>

        <div className="actions-grid">
          <button
            type="button"
            className="action-card-btn warmup-btn highlight"
            onClick={() => handleAction("warmup")}
            disabled={!isAuthenticated || !!loadingAction}
          >
            <div className="btn-icon warmup">
              <Flame size={22} className={loadingAction === "warmup" ? "spin" : ""} />
            </div>
            <div className="btn-text">
              <strong>🔥 پۈتۈن تور بەت ۋە رەسىملەرنى تولۇق قىزىتىش (Global Pre-Warm)</strong>
              <span>بارلىق بەتلەر ۋە رەسىملەرنى ئارقا پىلاندا يۈكلەپ، كېيىنكى زىيارەتچىلەرگە 0ms تېزلىكتە تەييارلايدۇ</span>
            </div>
          </button>

          <button
            type="button"
            className="action-card-btn highlight"
            onClick={() => handleAction("warm-images")}
            disabled={!isAuthenticated || !!loadingAction}
          >
            <div className="btn-icon warmup">
              <ImageIcon size={22} className={loadingAction === "warm-images" ? "spin" : ""} />
            </div>
            <div className="btn-text">
              <strong>🖼️ رەسىملەرنى Vercel CDN گە تولۇق قىزىتىش (Pre-Warm Images)</strong>
              <span>ئەڭ يېڭى 50 يازما رەسىملىرىنى كىچىك ھەجىمدە (WebP KB) Vercel Edge غا يۈكلەپ ئىسسىتىدۇ</span>
            </div>
          </button>

          <button
            type="button"
            className="action-card-btn"
            onClick={() => handleAction("home")}
            disabled={!isAuthenticated || !!loadingAction}
          >
            <div className="btn-icon home">
              <Zap size={22} />
            </div>
            <div className="btn-text">
              <strong>باشبەتنى يېڭىلاش</strong>
              <span>باشبەت ۋە ئۈستى-ئاستى تىزىملىكلەرنى يېڭىلايدۇ (/uy)</span>
            </div>
          </button>

          <button
            type="button"
            className="action-card-btn"
            onClick={() => handleAction("podcasts")}
            disabled={!isAuthenticated || !!loadingAction}
          >
            <div className="btn-icon podcast">
              <Volume2 size={22} />
            </div>
            <div className="btn-text">
              <strong>پودكاستلارنى يېڭىلاش</strong>
              <span>پودكاست بېتى ۋە سىن تىزىملىكىنى يېڭىلايدۇ (/uy/podcasts)</span>
            </div>
          </button>

          <button
            type="button"
            className="action-card-btn highlight"
            onClick={() => handleAction("sync")}
            disabled={!isAuthenticated || !!loadingAction}
          >
            <div className="btn-icon sync">
              <RefreshCw size={22} className={loadingAction === "sync" ? "spin" : ""} />
            </div>
            <div className="btn-text">
              <strong>ئۆزگىرىشلەرنى ماسلاشتۇرۇش (Auto-Sync)</strong>
              <span>تەھرىرلەنگەن ئەڭ يېڭى يازمىلارنى تەكشۈرۈپ ئاپتوماتىك قايتا تېز خاتىرە قىلىدۇ</span>
            </div>
          </button>

          <button
            type="button"
            className="action-card-btn danger"
            onClick={() => handleAction("all")}
            disabled={!isAuthenticated || !!loadingAction}
          >
            <div className="btn-icon all">
              <RefreshCw size={22} className={loadingAction === "all" ? "spin" : ""} />
            </div>
            <div className="btn-text">
              <strong>بارلىق تېز خاتىرە ئەسلىمىنى تازىلاش</strong>
              <span>پۈتۈن تور بېكەت قۇرۇلمىسى ۋە بارلىق بەتلەرنى قايتا سالىدۇ (Purge All)</span>
            </div>
          </button>
        </div>
      </section>

      {/* Single Post Form & Webhook Guide */}
      <div className="cache-split-grid">
        {/* Single URL revalidate */}
        <section className="cache-card-box">
          <h3>كونكرېت بىر يازمىنى يېڭىلاش</h3>
          <p>ئەگەر مەلۇم بىر يازمىنى تۈزەتكەن بولسىڭىز، ئۇنىڭ ئادرېسى ياكى قىسقا نامىنى كىرگۈزۈڭ:</p>

          <form onSubmit={handleSingleSubmit} className="single-form">
            <input
              type="text"
              value={singlePath}
              onChange={e => setSinglePath(e.target.value)}
              placeholder="مەسىلەن: 2026/08/11/turkiyening_iqtisas_egilirining... ياكى تولۇق URL"
              dir="ltr"
              disabled={!isAuthenticated || !!loadingAction}
            />
            <button
              type="submit"
              className="btn-single-submit"
              disabled={!isAuthenticated || !!loadingAction || !singlePath.trim()}
            >
              بۇ بەتنى يېڭىلاش
            </button>
          </form>
        </section>

        {/* Webhook & Cron Information */}
        <section className="cache-card-box">
          <h3>WordPress Webhook & Vercel Cron ئۇلانمىسى</h3>
          <p>
            WordPress تە يازما ئېلان قىلىنغاندا ئاپتوماتىك يېڭىلاش ئۈچۈن تۆۋەندىكى URL نى
            WordPress تىكى Webhook قىستۇرمىسىغا (مەسىلەن: WP Webhooks) چاپلىسىڭىز بولىدۇ:
          </p>

          <div className="webhook-copy-box">
            <code dir="ltr" suppressHydrationWarning>{webhookUrl}</code>
            <button type="button" onClick={copyWebhook} className="btn-copy">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "كۆچۈرۈلدى" : "كۆچۈرۈش"}
            </button>
          </div>

          <div className="cron-note">
            <small>
              ⚡ <b>Vercel Cron:</b> ھەر 15 مىنۇتتا ئارقا سەھنىدە <code>/api/cron/sync</code> ئارقىلىق
              WordPress تىكى يېڭىلانغان يازمىلارنى ئاپتوماتىك تەكشۈرۈپ تۇرىدۇ.
            </small>
          </div>
        </section>
      </div>

      {/* Terminal Log Console */}
      <section className="cache-console-card">
        <div className="console-header">
          <div className="console-title">
            <Terminal size={17} /> مەشغۇلات خاتىرىسى (Live Activity Log)
          </div>
          <button type="button" className="btn-clear-log" onClick={() => setLogs([])}>
            خاتىرىنى تازىلاش
          </button>
        </div>
        <div className="console-body" dir="ltr">
          {logs.map(log => (
            <div key={log.id} className={`console-line ${log.type}`}>
              <span className="log-time">[{log.time}]</span>
              <span className="log-msg">{log.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Return */}
      <div className="cache-footer-links">
        <Link href="/uy" className="back-link">
          <ArrowLeft size={16} /> باشبەتكە قايتىش
        </Link>
        <Link href="/uy/podcasts" className="back-link">
          پودكاستلار بېتىنى كۆرۈش <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}
