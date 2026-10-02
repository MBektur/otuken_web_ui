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
      text: "Башқуруш Системиси Тәййарланди. Мәхпий Ачқуч Билән Улансиңиз Болиду.",
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
          text: "Башқуруш Системиси Тәййарланди. Мәхпий Ачқуч Билән Улансиңиз Болиду.",
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
        addLog(`✅ Салаһийәт Дәлилләнди. WordPress Тин ${data.totalPosts} Йазма Байқалди.`, "success");
      } else {
        setIsAuthenticated(false);
        addLog(`❌ Мәхпий Ачқуч Хата Йаки Инавәтсиз.`, "error");
      }
    } catch (err: any) {
      setIsAuthenticated(false);
      addLog(`❌ Улиниш Мәғлуп Болди: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleAction(action: "all" | "sync" | "home" | "podcasts" | "warmup") {
    setLoadingAction(action);
    const start = performance.now();
    addLog(`⏳ ${action.toUpperCase()} Йеңилаш / Қизитиш Мәшғулати Йолланди...`, "info");

    try {
      let endpoint = `/api/revalidate?secret=${encodeURIComponent(secret)}`;
      if (action === "all") endpoint += "&action=all";
      else if (action === "sync") endpoint += "&action=sync";
      else if (action === "warmup") endpoint += "&action=warmup&limit=100";
      else if (action === "home") endpoint += "&action=single&path=/ug";
      else if (action === "podcasts") endpoint += "&action=single&path=/ug/podcasts";

      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);

      if (res.ok && data.ok) {
        addLog(`✅ Мувәппәқийәтлик Тамам block (${elapsed}ms): ${data.message || "Тез Хатирә Йеңиланди"}`, "success");
        if (data.samplePaths?.length) {
          addLog(`⚡ Қизитилған Талланма Бәтләр: ${data.samplePaths.slice(0, 5).join(", ")}...`, "info");
        }
        if (action === "sync" || action === "all" || action === "warmup") {
          refreshStatus();
        }
      } else {
        addLog(`❌ Хаталиқ Көрүлди (${elapsed}ms): ${data.error || "Намәлум Хаталиқ"}`, "error");
      }
    } catch (err: any) {
      addLog(`❌ Тор Йаки Система Хаталиқи: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!singlePath.trim()) return;

    setLoadingAction("single");
    const start = performance.now();
    addLog(`⏳ «${singlePath}» Ни Йеңилаш Йолланди...`, "info");

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
        addLog(`✅ Тамам (${elapsed}ms): ${data.message}`, "success");
        setSinglePath("");
      } else {
        addLog(`❌ Мәғлуп Болди (${elapsed}ms): ${data.error || "Намәлум Хаталиқ"}`, "error");
      }
    } catch (err: any) {
      addLog(`❌ Хаталиқ: ${err.message}`, "error");
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
    addLog(`📋 Webhook Уланмиси Көчүрүлди.`, "info");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="cache-admin-container">
      {/* Top Admin Navigation Tabs */}
      <nav className="admin-nav-tabs" aria-label="Admin Navigation">
        <Link
          href="/ug/admin/settings"
          className="admin-tab-btn"
        >
          <Volume2 size={16} />
          <span>Podkast we Video Tengshekliri</span>
        </Link>
        <Link
          href="/ug/admin/cache"
          className="admin-tab-btn active"
        >
          <Zap size={16} />
          <span>Tez Khatire we Masqedemlesh</span>
        </Link>
      </nav>

      {/* Top Banner */}
      <header className="cache-admin-header">
        <div className="cache-admin-title">
          <div className="cache-icon-box">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1>Тез Хатирә Әслимиси Вә Йеңилаш Мәркизи</h1>
            <p>Vercel Edge ISR, Арқа Пилан Тәкшүрүш Вә Дәрһал Өчүрүп Қайта Йеңилаш Системиси</p>
          </div>
        </div>

        <div className="cache-auth-bar">
          <div className="cache-input-group">
            <Lock size={15} />
            <input
              type="password"
              value={inputSecret}
              onChange={e => setInputSecret(e.target.value)}
              placeholder="Мәхпий Ачқуч (Secret Key)..."
              dir="ltr"
            />
            <button
              type="button"
              className="btn-auth-save"
              onClick={() => checkAuth(inputSecret)}
              disabled={loadingAction === "auth"}
            >
              {loadingAction === "auth" ? "Тәкшүрүватиду..." : "Дәлилләш"}
            </button>
          </div>
          <span className={`status-pill ${isAuthenticated ? "online" : "offline"}`}>
            <span className="dot" />
            {isAuthenticated ? "Актип / Рухсәтлик" : "Кирилмиди"}
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
            <span className="metric-label">WordPress Әһвали</span>
            <strong className="metric-value">{status?.ok ? "Уланған (Online)" : "Күтүлмәктә..."}</strong>
            <small>orhunpolicycenter.com</small>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon posts">
            <FileText size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Җәмий Йазмилар</span>
            <strong className="metric-value" dir="ltr">
              {status ? status.totalPosts : "..."}
            </strong>
            <small>Елан Қилинған Мәзмун Сани</small>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon clock">
            <Clock3 size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Әң Йеңи Өзгәртиш</span>
            <strong className="metric-value metric-date" dir="ltr">
              {status?.latestModified ? status.latestModified.replace("T", " ") : "Тепилмиди"}
            </strong>
            <small>WordPress Тики Тәһрир Вақти</small>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon latest">
            <Radio size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Әң Йеңи Йазма</span>
            <strong className="metric-value metric-title">
              {status?.latestTitle || "Тепилмиди"}
            </strong>
            <small>Ахирқи Мәзмун</small>
          </div>
        </div>
      </section>

      {/* Actions Section */}
      <section className="cache-actions-section">
        <div className="section-title-wrap">
          <h2>Тез Сүрәтлик Йеңилаш Мәшғулатлири</h2>
          <p>Төвәндики Кунупкилар Билән Vercel Ниң Edge Тез Хатирәни Дәрһал Бошитип Йеңилийалайсиз.</p>
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
              <strong>🔥 Пүтүн Тор Бәтни Қизитиш Вә Толуқ Тез Хатирә Йеңилаш (Global Pre-Warm)</strong>
              <span>Барлиқ Йазмиларни Арқа Пиланда Йүкләп, Кейинки Зийарәтчиләргә 0ms Лиқ Тезлик Билән Чиқирип Бериду</span>
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
              <strong>Башбәтни Йеңилаш</strong>
              <span>Башбәт Вә Үсти-Асти Тизимликләрни Йеңилайду (/uy)</span>
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
              <strong>Подкастларни Йеңилаш</strong>
              <span>Подкаст Бети Вә Син Тизимликини Йеңилайду (/ug/podcasts)</span>
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
              <strong>Өзгиришләрни Маслаштуруш (Auto-Sync)</strong>
              <span>Тәһрирләнгән Әң Йеңи Йазмиларни Тәкшүрүп Аптоматик Қайта Тез Хатирә Қилиду</span>
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
              <strong>Барлиқ Тез Хатирә Әслимини Тазилаш</strong>
              <span>Пүтүн Тор Бекәт Қурулмиси Вә Барлиқ Бәтләрни Қайта Салиду (Purge All)</span>
            </div>
          </button>
        </div>
      </section>

      {/* Single Post Form & Webhook Guide */}
      <div className="cache-split-grid">
        {/* Single URL revalidate */}
        <section className="cache-card-box">
          <h3>Конкрет Бир Йазмини Йеңилаш</h3>
          <p>Әгәр Мәлум Бир Йазмини Түзәткән Болсиңиз, Униң Адреси Йаки Қисқа Намини Киргүзүң:</p>

          <form onSubmit={handleSingleSubmit} className="single-form">
            <input
              type="text"
              value={singlePath}
              onChange={e => setSinglePath(e.target.value)}
              placeholder="Мәсилән: 2026/08/11/turkiyening_iqtisas_egilirining... Йаки Толуқ URL"
              dir="ltr"
              disabled={!isAuthenticated || !!loadingAction}
            />
            <button
              type="submit"
              className="btn-single-submit"
              disabled={!isAuthenticated || !!loadingAction || !singlePath.trim()}
            >
              Бу Бәтни Йеңилаш
            </button>
          </form>
        </section>

        {/* Webhook & Cron Information */}
        <section className="cache-card-box">
          <h3>WordPress Webhook & Vercel Cron Уланмиси</h3>
          <p>
            WordPress Тә Йазма Елан Қилинғанда Аптоматик Йеңилаш Үчүн Төвәндики URL Ни
            WordPress Тики Webhook Қистурмисиға (Мәсилән: WP Webhooks) Чаплисиңиз Болиду:
          </p>

          <div className="webhook-copy-box">
            <code dir="ltr" suppressHydrationWarning>{webhookUrl}</code>
            <button type="button" onClick={copyWebhook} className="btn-copy">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Көчүрүлди" : "Көчүрүш"}
            </button>
          </div>

          <div className="cron-note">
            <small>
              ⚡ <b>Vercel Cron:</b> Һәр 15 Минутта Арқа Сәһнидә <code>/api/cron/sync</code> Арқилиқ
              WordPress Тики Йеңиланған Йазмиларни Аптоматик Тәкшүрүп Туриду.
            </small>
          </div>
        </section>
      </div>

      {/* Terminal Log Console */}
      <section className="cache-console-card">
        <div className="console-header">
          <div className="console-title">
            <Terminal size={17} /> Мәшғулат Хатириси (Live Activity Log)
          </div>
          <button type="button" className="btn-clear-log" onClick={() => setLogs([])}>
            Хатирини Тазилаш
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
        <Link href="/ug" className="back-link">
          <ArrowLeft size={16} /> Башбәткә Қайтиш
        </Link>
        <Link href="/ug/podcasts" className="back-link">
          Подкастлар Бетини Көрүш <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}
