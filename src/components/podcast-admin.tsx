"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Volume2,
  Zap,
  Lock,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  Star,
  ExternalLink,
  Youtube,
  Play,
  Copy,
  Check,
  RefreshCw,
  Eye,
  FileText,
  AlertCircle,
  Clock,
  Share2,
  X,
  Download,
  Bell,
  Inbox,
} from "lucide-react";
import type { CuratedPodcast } from "@/lib/podcast-store";

interface PodcastAdminProps {
  locale?: "uy" | "ug";
}

export function PodcastAdmin({ locale = "uy" }: PodcastAdminProps) {
  const isUg = locale === "ug";

  const [secret, setSecret] = useState("otuken2026");
  const [inputSecret, setInputSecret] = useState("otuken2026");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [podcasts, setPodcasts] = useState<CuratedPodcast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ytUrlInput, setYtUrlInput] = useState("");
  const [extractedYtId, setExtractedYtId] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("سىياسەت ۋە دۇنيا");
  const [postSlugInput, setPostSlugInput] = useState("");
  const [isFeaturedInput, setIsFeaturedInput] = useState(false);
  const [durationInput, setDurationInput] = useState(25);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);

  // Export Modal / Section
  const [showJsonExport, setShowJsonExport] = useState(false);
  const [copied, setCopied] = useState(false);

  const LOCAL_DELETED_KEY = "otuken_deleted_podcast_ids";

  function getLocalDeletedIds(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LOCAL_DELETED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function addLocalDeletedId(id: string) {
    if (typeof window === "undefined") return;
    try {
      const current = getLocalDeletedIds();
      if (!current.includes(id)) {
        current.push(id);
        localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(current));
      }
    } catch {}
  }

  // Load saved secret & initial list
  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("otuken_cache_secret") : null;
    const key = saved || "otuken2026";
    setSecret(key);
    setInputSecret(key);
    loadPodcasts(key);
  }, []);

  function showMessage(text: string, type: "success" | "error" | "info" = "info") {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  }

  async function loadPodcasts(key: string) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/podcasts?secret=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setIsAuthenticated(true);
        const deletedIds = getLocalDeletedIds();
        const serverList: CuratedPodcast[] = data.podcasts || [];
        const activeList = serverList.filter(p => !deletedIds.includes(p.id) && !deletedIds.includes(p.youtubeId));
        setPodcasts(activeList);
        sessionStorage.setItem("otuken_cache_secret", key);
      } else {
        setIsAuthenticated(false);
        showMessage(data.message || (isUg ? "Parol xata (Unauthorized)" : "مەخپىي ئاچقۇچ خاتا"), "error");
      }
    } catch (err: any) {
      setIsAuthenticated(false);
      showMessage(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  const getActiveSecret = () => inputSecret?.trim() || secret || "otuken2026";

  function handleSaveKey() {
    const key = inputSecret.trim();
    setSecret(key);
    sessionStorage.setItem("otuken_cache_secret", key);
    loadPodcasts(key);
  }

  // Auto extract YouTube ID
  function handleUrlChange(val: string) {
    setYtUrlInput(val);
    const cleaned = val.trim();
    let detected = "";

    if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned)) {
      detected = cleaned;
    } else {
      const patterns = [
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
        /youtube\.com\/shorts\/([\w-]{11})/,
        /youtube\.com\/live\/([\w-]{11})/,
      ];
      for (const pattern of patterns) {
        const match = cleaned.match(pattern);
        if (match && match[1]) {
          detected = match[1];
          break;
        }
      }
    }

    if (detected) {
      setExtractedYtId(detected);
    }
  }

  // Fetch YouTube Metadata via API
  async function fetchYtMetadata() {
    if (!extractedYtId && !ytUrlInput) {
      showMessage(isUg ? "Awval YouTube linkini kirguzung" : "ئاۋۋال YouTube ئۇلانمىسىنى كىرگۈزۈڭ", "error");
      return;
    }

    setIsFetchingMeta(true);
    try {
      const res = await fetch("/api/admin/podcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: getActiveSecret(),
          action: "fetchMeta",
          url: extractedYtId || ytUrlInput,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.youtubeId) setExtractedYtId(data.youtubeId);
        if (data.title && !titleInput) setTitleInput(data.title);
        showMessage(isUg ? "YouTube uchurliri tapildi" : "YouTube ئۇچۇرلىرى تېپىلدى", "success");
      } else {
        showMessage(data.message || (isUg ? "Tapilmidi" : "تېپىلمىدى"), "error");
      }
    } catch (e: any) {
      showMessage(e.message, "error");
    } finally {
      setIsFetchingMeta(false);
    }
  }

  function handleResetForm() {
    setEditingId(null);
    setYtUrlInput("");
    setExtractedYtId("");
    setTitleInput("");
    setDescInput("");
    setCategoryInput(isUg ? "Siyaset we Dunya" : "سىياسەت ۋە دۇنيا");
    setPostSlugInput("");
    setIsFeaturedInput(false);
    setDurationInput(25);
  }

  function handleStartEdit(p: CuratedPodcast) {
    setEditingId(p.id);
    setExtractedYtId(p.youtubeId);
    setYtUrlInput(`https://www.youtube.com/watch?v=${p.youtubeId}`);
    setTitleInput(p.title);
    setDescInput(p.description || "");
    setCategoryInput(p.category || (isUg ? "Siyaset we Dunya" : "سىياسەت ۋە دۇنيا"));
    setPostSlugInput(p.postSlug || "");
    setIsFeaturedInput(Boolean(p.isFeatured));
    setDurationInput(p.durationMinutes || 25);

    // Scroll form into view
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  async function handleSavePodcast(e: React.FormEvent) {
    e.preventDefault();
    const ytId = extractedYtId.trim();

    if (!ytId) {
      showMessage(isUg ? "YouTube ID yaki linki kerek" : "YouTube ID ياكى ئۇلانمىسى تەلەپ قىلىنىدۇ", "error");
      return;
    }
    if (!titleInput.trim()) {
      showMessage(isUg ? "Mawzu kerek" : "تېما تەلەپ قىلىنىدۇ", "error");
      return;
    }

    setIsLoading(true);
    try {
      const payload: Partial<CuratedPodcast> & { youtubeId: string; title: string } = {
        id: editingId || undefined,
        youtubeId: ytId,
        title: titleInput.trim(),
        description: descInput.trim(),
        category: categoryInput.trim(),
        postSlug: postSlugInput.trim() || undefined,
        isFeatured: isFeaturedInput,
        durationMinutes: Number(durationInput) || 25,
      };

      const res = await fetch("/api/admin/podcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: getActiveSecret(),
          action: editingId ? "update" : "add",
          podcast: payload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setPodcasts(data.podcasts || []);
        showMessage(isUg ? "Podkast saqlandi!" : "پودكاست ساقلاندى!", "success");
        handleResetForm();
      } else {
        showMessage(data.message || (isUg ? "Xataliq" : "خاتالىق كۆرۈلدى"), "error");
      }
    } catch (err: any) {
      showMessage(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSetFeatured(id: string) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/podcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: getActiveSecret(), action: "setFeatured", id }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPodcasts(data.podcasts || []);
        showMessage(isUg ? "Hero video qilip tallandi!" : "باشبەتتىكى ئالاھىدە سىن قىلىپ بېكىتىلدى!", "success");
      } else {
        showMessage(data.message, "error");
      }
    } catch (e: any) {
      showMessage(e.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= podcasts.length) return;

    const list = [...podcasts];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    setPodcasts(list);

    const ids = list.map(p => p.id);
    try {
      const res = await fetch("/api/admin/podcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: getActiveSecret(), action: "reorder", ids }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPodcasts(data.podcasts || []);
        showMessage(isUg ? "Tertip yengilandi" : "تەرتىپ يېڭىلاندى", "success");
      }
    } catch (e: any) {
      showMessage(e.message, "error");
    }
  }

  async function executeDelete(id: string) {
    const activeSecret = getActiveSecret();
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/podcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: activeSecret, action: "delete", id }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        addLocalDeletedId(id);
        const deletedIds = getLocalDeletedIds();
        const serverList: CuratedPodcast[] = data.podcasts && data.podcasts.length >= 0 ? data.podcasts : podcasts;
        const updatedList = serverList.filter((p: CuratedPodcast) => !deletedIds.includes(p.id) && !deletedIds.includes(p.youtubeId));
        setPodcasts(updatedList);
        showMessage(isUg ? "Podkast ochuruldi" : "پودكاست ئۆچۈرۈلدى", "success");
        setConfirmDeleteId(null);
      } else {
        showMessage(data.message || (isUg ? "Ochurush meglup boldi" : "ئۆچۈرۈش مەغلۇپ بولدى"), "error");
      }
    } catch (e: any) {
      showMessage(e.message || (isUg ? "Xataliq yuz berdi" : "خاتالىق يۈز بەردى"), "error");
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopyJson() {
    const jsonStr = JSON.stringify(podcasts, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    showMessage(isUg ? "JSON nuskilandi" : "JSON نۇسخىلاندى", "success");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadJson() {
    const jsonStr = JSON.stringify(podcasts, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "podcasts.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage(isUg ? "podcasts.json fayli chushurwelindi" : "podcasts.json ھۆججىتى چۈشۈرۈۋېلىندى", "success");
  }

  const featuredPodcast = podcasts.find(p => p.isFeatured) || podcasts[0];

  return (
    <div className="cache-admin-container podcast-admin-layout">
      {/* Top Admin Navigation Tabs */}
      <nav className="admin-nav-tabs" aria-label="Admin Navigation">
        <Link
          href={`/${locale}/admin/settings`}
          className="admin-tab-btn active"
        >
          <Volume2 size={16} />
          <span>{isUg ? "Podkast we Video Tengshekliri" : "پودكاست ۋە سىن تەڭشەكلىرى"}</span>
        </Link>
        <Link
          href={`/${locale}/admin/cache`}
          className="admin-tab-btn"
        >
          <Zap size={16} />
          <span>{isUg ? "Tez Khatire we Masqedemlesh" : "تېز ساقلىغۇچ ۋە ماسقەدەملەش"}</span>
        </Link>
        <Link
          href={`/${locale}/admin/push`}
          className="admin-tab-btn"
        >
          <Bell size={16} />
          <span>{isUg ? "Uqturesh Ewetish (Push)" : "ئۇقتۇرۇش ئەۋەتىش (Web Push)"}</span>
        </Link>
        <Link
          href={`/${locale}/admin/messages`}
          className="admin-tab-btn"
        >
          <Inbox size={16} />
          <span>{isUg ? "Kelgen Uchurlar" : "كەلگەن ئۇچۇرلار"}</span>
        </Link>
        <Link
          href={`/${locale}/podcasts`}
          target="_blank"
          className="admin-tab-btn admin-tab-preview"
        >
          <Eye size={16} />
          <span>{isUg ? "Canli Sehifini Korush" : "جانلىق بەتنى كۆرۈش"}</span>
          <ExternalLink size={12} />
        </Link>
      </nav>

      {/* Admin Header */}
      <header className="cache-admin-header">
        <div className="cache-admin-title">
          <div className="cache-icon-box" style={{ background: "rgba(244, 180, 26, 0.15)", color: "#c68a00" }}>
            <Volume2 size={28} />
          </div>
          <div>
            <h1>{isUg ? "Podkast we Video Bashqurush Merkizi" : "پودكاست ۋە سىن باشقۇرۇش مەركىزى"}</h1>
            <p>
              {isUg
                ? "YouTube arqiliq orunlashturush, bashbetke ayrim video bekitish we maqale bilen ulash"
                : "YouTube ئۇلانمىسى ئارقىلىق پودكاست قوشۇش، ئالاھىدە سىننى بېكىتىش ۋە مەخسۇس ئانالىز ماقالىلىرى بىلەن تۇتاشتۇرۇش"}
            </p>
          </div>
        </div>

        <div className="cache-auth-bar">
          <div className="cache-input-group">
            <Lock size={15} />
            <input
              type="password"
              value={inputSecret}
              onChange={e => setInputSecret(e.target.value)}
              placeholder={isUg ? "Mexpiy achquch..." : "مەخپىي ئاچقۇچ..."}
              dir="ltr"
            />
            <button
              type="button"
              className="btn-auth-save"
              onClick={handleSaveKey}
              disabled={isLoading}
            >
              {isUg ? "Dəlilləsh" : "دەلىللەش"}
            </button>
          </div>

          <div className={`status-pill ${isAuthenticated ? "online" : "offline"}`}>
            <span className="dot" />
            <span>{isAuthenticated ? (isUg ? "Ulandi" : "ئۇلاندى") : (isUg ? "Ulanmidi" : "ئۇلانمىدى")}</span>
          </div>
        </div>
      </header>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div className={`admin-notification-toast ${statusMessage.type}`}>
          <AlertCircle size={18} />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="cache-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon wp">
            <Volume2 size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-label">{isUg ? "Jemiy Podkast San" : "جەمئىي پودكاست سانى"}</span>
            <span className="metric-value" dir="ltr">{podcasts.length}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon latest" style={{ background: "rgba(244, 180, 26, 0.2)", color: "#b38100" }}>
            <Star size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-label">{isUg ? "Hero / Alahide Video" : "ئالاھىدە سىن (Hero)"}</span>
            <span className="metric-value">
              {featuredPodcast ? featuredPodcast.title.slice(0, 32) + "..." : "---"}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon posts">
            <FileText size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-label">{isUg ? "Yazma Bilen Ulanganlar" : "ماقالە بىلەن ئۇلانغانلار"}</span>
            <span className="metric-value" dir="ltr">
              {podcasts.filter(p => !!p.postSlug).length} / {podcasts.length}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon clock">
            <Share2 size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-label">{isUg ? "Zapaslash / Export" : "زاپاسلاش / نۇسخا"}</span>
            <button
              type="button"
              className="quick-action-link"
              onClick={() => setShowJsonExport(!showJsonExport)}
            >
              {showJsonExport ? (isUg ? "Yushurush" : "يوشۇرۇش") : (isUg ? "JSON Korush" : "JSON كۆرۈش")}
            </button>
          </div>
        </div>
      </div>

      {/* JSON Export Drawer */}
      {showJsonExport && (
        <section className="admin-subpanel" style={{ marginBottom: "28px" }}>
          <div className="subpanel-header">
            <h3>{isUg ? "Podkast JSON Zapaslash" : "پودكاست ئۇچۇرلىرىنى JSON سۈپىتىدە زاپاسلاش"}</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="btn-action-primary" onClick={handleDownloadJson}>
                <Download size={14} />
                <span>{isUg ? "Faylni Chushurush" : "ھۆججەتنى چۈشۈرۈش"}</span>
              </button>
              <button type="button" className="btn-action-primary" onClick={handleCopyJson}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? (isUg ? "Nuskilandi" : "كۆچۈرۈلدى") : (isUg ? "JSON Nuskilash" : "JSON نۇسخىلاش")}</span>
              </button>
            </div>
          </div>
          <pre className="json-export-box" dir="ltr">
            {JSON.stringify(podcasts, null, 2)}
          </pre>
        </section>
      )}

      {/* Add / Edit Form Card */}
      <section className="podcast-form-panel">
        <div className="panel-title-bar">
          <div className="panel-title-text">
            <h2>
              {editingId
                ? (isUg ? "Podkastni Ozgertish" : "پودكاستنى تەھرىرلەش")
                : (isUg ? "Yengi Podkast / Video Qoshush" : "يېڭى پودكاست ياكى سىن قوشۇش")}
            </h2>
            <p>
              {isUg
                ? "YouTube linkini kirguzsingiz rəsim we uchurlar aptomatik oqulidu"
                : "YouTube ئۇلانمىسى ياكى كودىنى كىرگۈزسىڭىز، سىن رەسىمى ۋە ئاساسى ئۇچۇرلار ئۆزلۈكىدىن ئوقۇلىدۇ."}
            </p>
          </div>
          {editingId && (
            <button type="button" className="btn-cancel-edit" onClick={handleResetForm}>
              {isUg ? "Bikar Qilish" : "بىكار قىلىش"}
            </button>
          )}
        </div>

        <form onSubmit={handleSavePodcast} className="podcast-form-grid">
          {/* Left Inputs */}
          <div className="podcast-inputs-col">
            {/* YouTube URL or ID */}
            <div className="form-field-group">
              <label htmlFor="yt-url-input">
                <Youtube size={15} color="#e53935" />
                <span>YouTube Linki yaki Video ID</span>
                <b className="required-star">*</b>
              </label>
              <div className="url-input-wrap">
                <input
                  id="yt-url-input"
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... yaki NlgZanVJZw8"
                  value={ytUrlInput}
                  onChange={e => handleUrlChange(e.target.value)}
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  className="btn-fetch-meta"
                  onClick={fetchYtMetadata}
                  disabled={isFetchingMeta}
                >
                  {isFetchingMeta ? <RefreshCw size={13} className="spin" /> : <Zap size={13} />}
                  <span>{isUg ? "Aptomatik" : "ئاپتوماتىك"}</span>
                </button>
              </div>
              {extractedYtId && (
                <div className="detected-yt-id" dir="ltr">
                  <span>Detected ID:</span> <code>{extractedYtId}</code>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="form-field-group">
              <label htmlFor="title-input">
                <span>{isUg ? "Mawzu (Title)" : "پودكاست تېمىسى"}</span>
                <b className="required-star">*</b>
              </label>
              <input
                id="title-input"
                type="text"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                placeholder={isUg ? "Mawzuni kirguzung..." : "تېمىنى كىرگۈزۈڭ..."}
                required
              />
            </div>

            {/* Description */}
            <div className="form-field-group">
              <label htmlFor="desc-input">
                <span>{isUg ? "Qisqiche Mezmun (Description)" : "قىسقىچە مەزمۇنى ياكى تونۇشتۇرۇش"}</span>
              </label>
              <textarea
                id="desc-input"
                rows={3}
                value={descInput}
                onChange={e => setDescInput(e.target.value)}
                placeholder={isUg ? "Video yaki suhbet heqqide..." : "سىن ياكى سۆھبەتنىڭ قىسقىچە چۈشەندۈرۈلۈشى..."}
              />
            </div>

            {/* Row: Category + Duration */}
            <div className="form-fields-row">
              <div className="form-field-group">
                <label htmlFor="cat-input">
                  <span>{isUg ? "Katégoriye" : "سەھىپە / تۈرى"}</span>
                </label>
                <input
                  id="cat-input"
                  type="text"
                  value={categoryInput}
                  onChange={e => setCategoryInput(e.target.value)}
                  placeholder="سىياسەت ۋە دۇنيا"
                />
                <div className="quick-cat-chips">
                  {["سىياسەت ۋە دۇنيا", "ھەربىي ۋە ئىستراتېگىيە", "ئىقتىساد", "كىتاب تەھلىلى", "دۇنيادا بۇ ھەپتە"].map(c => (
                    <button
                      key={c}
                      type="button"
                      className="cat-chip"
                      onClick={() => setCategoryInput(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field-group duration-field">
                <label htmlFor="duration-input">
                  <Clock size={14} />
                  <span>{isUg ? "Waqti (Minut)" : "ۋاقتى (مىنۇت)"}</span>
                </label>
                <input
                  id="duration-input"
                  type="number"
                  min={1}
                  max={300}
                  value={durationInput}
                  onChange={e => setDurationInput(Number(e.target.value) || 20)}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Associated Article Slug */}
            <div className="form-field-group">
              <label htmlFor="slug-input">
                <FileText size={14} />
                <span>{isUg ? "Tordiki Maqale Slug (Ixtiyariy)" : "بېكەتتىكى مۇناسىۋەتلىك ماقالە ئۇلانمىسى (slug)"}</span>
              </label>
              <input
                id="slug-input"
                type="text"
                value={postSlugInput}
                onChange={e => setPostSlugInput(e.target.value)}
                placeholder="mesilen: elon_mask_bilen_sohbet_suniy_idrak..."
                dir="ltr"
              />
              <span className="field-hint">
                {isUg
                  ? "Buni kirguzsingiz tor bettiki toluk analize maqalisi bilen biwasite ulinidu."
                  : "مەزكۇر قۇرشۇنى تولدۇرسىڭىز، تاماشىبىن «ماقالىنى ئوقۇش» كۇنۇپكىسى بىلەن تەپسىلىي يازمىغا ئۆتەلەيدۇ."}
              </span>
            </div>

            {/* Featured Hero Switch */}
            <div className="form-switch-row">
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={isFeaturedInput}
                  onChange={e => setIsFeaturedInput(e.target.checked)}
                />
                <span className="switch-slider" />
                <span className="switch-text">
                  <Star size={15} color="#e6a100" />
                  <b>{isUg ? "Bashbetteki Hero / Alahide Video Qilish" : "سەھىپىنىڭ بېشىدىكى ئالاھىدە سىن (Hero) قىلىپ بېكىتىش"}</b>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="form-actions-row">
              <button
                type="submit"
                className="btn-submit-podcast"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>{isUg ? "Saqliniwatidu..." : "ساقلىنىۋاتىدۇ..."}</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>{editingId ? (isUg ? "Ozgertishni Saqlash" : "ئۆزگەرتىشنى ساقلاش") : (isUg ? "Podkastni Qoshush" : "پودكاستنى قوشۇش")}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Live Preview Box */}
          <div className="podcast-preview-col">
            <span className="preview-label">{isUg ? "Canli Aldinala Korush" : "جانلىق سىن ئالدىن كۆرۈش"}</span>
            <div className="preview-card-box">
              {extractedYtId ? (
                <div className="preview-embed-frame">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractedYtId}`}
                    title="Preview"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="preview-placeholder">
                  <Youtube size={44} color="#999" />
                  <span>{isUg ? "YouTube linkini kurguzung" : "YouTube ئۇلانمىسىنى كىرگۈزۈڭ"}</span>
                </div>
              )}

              <div className="preview-meta-info">
                {isFeaturedInput && (
                  <span className="preview-badge-featured">
                    <Star size={12} /> {isUg ? "Hero Video" : "ئالاھىدە سىن"}
                  </span>
                )}
                <h4>{titleInput || (isUg ? "Podkast Mawzusi..." : "پودكاست تېمىسى...")}</h4>
                <p>{descInput || (isUg ? "Qisqiche mezmun..." : "قىسقىچە مەزمۇن بۇ يەردە كۆرۈنىدۇ...")}</p>
                <div className="preview-footer-pills">
                  <span className="preview-cat-pill">{categoryInput || "سىياسەت"}</span>
                  <span className="preview-duration-pill">{durationInput} {isUg ? "minut" : "مىنۇت"}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* Episodes List Section */}
      <section className="podcasts-manage-section">
        <div className="manage-header-bar">
          <div className="manage-header-titles">
            <h2>{isUg ? "Barlik Qisimliri we Tertipi" : "بارلىق سانلار ۋە رەت-تەرتىپى"}</h2>
            <span>{isUg ? `Jemiy ${podcasts.length} qisim` : `جەمئىي ${podcasts.length} سان پودكاست`}</span>
          </div>
          <span className="order-hint">
            {isUg ? "⬆️ ⬇️ Kunupriliri arqiliq tertipni ozgertishingiz bolidu" : "⬆️ ۋە ⬇️ كۇنۇپكىلىرى ئارقىلىق سەھىپىدىكى چىقىش تەرتىپىنى ئۆزگەرتەلەيسىز."}
          </span>
        </div>

        <div className="podcasts-manage-list">
          {podcasts.map((pod, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === podcasts.length - 1;
            const thumbUrl = `https://img.youtube.com/vi/${pod.youtubeId}/hqdefault.jpg`;

            return (
              <article
                key={pod.id}
                className={`podcast-manage-row ${pod.isFeatured ? "is-featured" : ""} ${confirmDeleteId === pod.id ? "is-confirming-delete" : ""} ${deletingId === pod.id ? "is-deleting" : ""}`}
              >
                {/* Index / Order */}
                <div className="pod-order-badge">
                  <span>#{idx + 1}</span>
                </div>

                {/* Thumbnail */}
                <div className="pod-thumb-box">
                  <img src={thumbUrl} alt="" loading="lazy" />
                  <a
                    href={`https://www.youtube.com/watch?v=${pod.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pod-yt-direct"
                    title="YouTube دا كۆرۈش"
                  >
                    <Play size={14} fill="#fff" />
                  </a>
                </div>

                {/* Content details */}
                <div className="pod-info-box">
                  <div className="pod-info-meta">
                    {pod.isFeatured && (
                      <span className="badge-featured-pill">
                        <Star size={11} /> {isUg ? "Hero Video" : "ئالاھىدە سىن"}
                      </span>
                    )}
                    <span className="pod-cat-tag">{pod.category || "سىياسەت"}</span>
                    {pod.postSlug && (
                      <span className="pod-linked-slug" title={pod.postSlug}>
                        <FileText size={11} /> {isUg ? "Maqale Ulangan" : "يازما ئۇلانغان"}
                      </span>
                    )}
                    <span className="pod-date-tag" dir="ltr">
                      {pod.date ? pod.date.slice(0, 10) : ""}
                    </span>
                  </div>

                  <h3 className="pod-title-text">{pod.title}</h3>
                  <p className="pod-excerpt-text">{pod.description}</p>
                </div>

                {/* Action buttons */}
                <div className="pod-actions-col">
                  {confirmDeleteId === pod.id ? (
                    <div className="pod-inline-confirm-box" onClick={e => e.stopPropagation()}>
                      <span className="confirm-prompt-text">
                        {isUg ? "Rastla ochuremsiz?" : "راستلا ئۆچۈرەمسىز؟"}
                      </span>
                      <div className="confirm-btn-group">
                        <button
                          type="button"
                          className="btn-confirm-yes"
                          onClick={() => executeDelete(pod.id)}
                          disabled={deletingId === pod.id}
                          title={isUg ? "He-e, Ochurulsun" : "ھەئە، ئۆچۈرۈلسۇن"}
                        >
                          {deletingId === pod.id ? (
                            <RefreshCw size={12} className="spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          <span>{deletingId === pod.id ? (isUg ? "Ochuruluwatidu..." : "ئۆچۈرۈلۈۋاتىدۇ...") : (isUg ? "Ochurush" : "ئۆچۈرۈش")}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-confirm-no"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deletingId === pod.id}
                          title={isUg ? "Yaq, Waz kechish" : "ياق، ۋاز كېچىش"}
                        >
                          <X size={12} />
                          <span>{isUg ? "Yaq" : "ياق"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Pin Featured */}
                      {!pod.isFeatured ? (
                        <button
                          type="button"
                          className="btn-action-icon star"
                          title={isUg ? "Hero Qilish" : "ئالاھىدە سىن قىلىپ بېكىتىش"}
                          onClick={() => handleSetFeatured(pod.id)}
                        >
                          <Star size={15} />
                        </button>
                      ) : (
                        <span className="active-star-icon" title="Hero Video">
                          <Star size={16} fill="#F4B41A" color="#F4B41A" />
                        </span>
                      )}

                      {/* Reorder Up */}
                      <button
                        type="button"
                        className="btn-action-icon"
                        title={isUg ? "Yuqiriga" : "يۇقىرىغا يۆتكەش"}
                        onClick={() => handleMove(idx, "up")}
                        disabled={isFirst}
                      >
                        <ArrowUp size={15} />
                      </button>

                      {/* Reorder Down */}
                      <button
                        type="button"
                        className="btn-action-icon"
                        title={isUg ? "Towenge" : "تۆۋەنگە يۆتكەش"}
                        onClick={() => handleMove(idx, "down")}
                        disabled={isLast}
                      >
                        <ArrowDown size={15} />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        className="btn-action-icon edit"
                        title={isUg ? "Ozgertish" : "تەھرىرلەش"}
                        onClick={() => handleStartEdit(pod)}
                      >
                        <Edit2 size={15} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        className="btn-action-icon delete"
                        title={isUg ? "Ochurush" : "ئۆچۈرۈش"}
                        onClick={() => setConfirmDeleteId(pod.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
