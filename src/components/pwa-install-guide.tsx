"use client";

import { useEffect, useRef, useState } from "react";
import {
  Apple,
  Smartphone,
  Monitor,
  Share,
  PlusSquare,
  MoreVertical,
  Download,
  CheckCircle2,
  Sparkles,
  WifiOff,
  Bell,
  Zap,
  ExternalLink,
  Eye,
  X,
  Maximize2,
  ZoomIn,
  RotateCcw,
} from "lucide-react";
import { PushSubscriber } from "./push-subscriber";

type Platform = "ios" | "android" | "desktop";

export function PwaInstallGuide({ isUg = false }: { isUg?: boolean }) {
  const [activeTab, setActiveTab] = useState<Platform>("ios");
  const [canPrompt, setCanPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; alt: string } | null>(null);

  // ── Pinch-to-Zoom refs ──────────────────────────────────────────────────
  const lightboxImgRef = useRef<HTMLImageElement>(null);
  const lightboxWrapRef = useRef<HTMLDivElement>(null);
  const lightboxCardRef = useRef<HTMLDivElement>(null);
  const lastTapTime = useRef(0);
  const zoomState = useRef({
    scale: 1, tx: 0, ty: 0,
    lastDist: 0,
    isPinching: false,
    isPanning: false,
    panStartX: 0, panStartY: 0,
  });

  const applyZoom = () => {
    const img = lightboxImgRef.current;
    const card = lightboxCardRef.current;
    if (!img) return;
    const { scale, tx, ty } = zoomState.current;
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    // Show reset button when zoomed
    if (card) {
      if (scale > 1.05) card.classList.add("is-zoomed");
      else card.classList.remove("is-zoomed");
    }
  };

  const resetZoom = () => {
    const z = zoomState.current;
    z.scale = 1; z.tx = 0; z.ty = 0;
    z.isPinching = false; z.isPanning = false;
    if (lightboxImgRef.current) lightboxImgRef.current.style.transform = "";
    if (lightboxCardRef.current) lightboxCardRef.current.classList.remove("is-zoomed");
  };
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setActiveTab("ios");
    } else if (/android/.test(ua)) {
      setActiveTab("android");
    } else {
      setActiveTab("desktop");
    }

    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    if (window.deferredPwaInstallPrompt) {
      setCanPrompt(true);
    }

    const onInstallReady = () => setCanPrompt(true);
    window.addEventListener("pwa-install-ready", onInstallReady);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxImg(null);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pwa-install-ready", onInstallReady);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Body scroll lock + zoom reset on lightbox open/close
  useEffect(() => {
    if (lightboxImg) {
      document.body.style.overflow = "hidden";
      // Reset after DOM paints the new image
      requestAnimationFrame(resetZoom);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxImg]);

  // ── Non-passive touch handlers for pinch-to-zoom ─────────────────────────
  useEffect(() => {
    const wrap = lightboxWrapRef.current;
    if (!wrap || !lightboxImg) return;

    const onTouchStart = (e: TouchEvent) => {
      const z = zoomState.current;
      if (e.touches.length === 2) {
        z.isPinching = true;
        z.isPanning = false;
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        z.lastDist = Math.hypot(dx, dy);
      } else if (e.touches.length === 1) {
        // Double-tap detection
        const now = Date.now();
        if (now - lastTapTime.current < 280) {
          // Double tap → toggle 1x / 2.5x
          if (z.scale > 1.1) {
            z.scale = 1; z.tx = 0; z.ty = 0;
          } else {
            z.scale = 2.5;
          }
          applyZoom();
          lastTapTime.current = 0;
          return;
        }
        lastTapTime.current = now;

        if (z.scale > 1) {
          z.isPanning = true;
          z.isPinching = false;
          z.panStartX = e.touches[0].clientX - z.tx;
          z.panStartY = e.touches[0].clientY - z.ty;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const z = zoomState.current;
      if (e.touches.length === 2 && z.isPinching) {
        e.preventDefault(); // stop page scroll during pinch
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.hypot(dx, dy);
        const delta = dist / (z.lastDist || dist);
        z.scale = Math.min(Math.max(z.scale * delta, 1), 5);
        z.lastDist = dist;
        applyZoom();
      } else if (e.touches.length === 1 && z.isPanning) {
        e.preventDefault(); // stop page scroll while panning
        z.tx = e.touches[0].clientX - z.panStartX;
        z.ty = e.touches[0].clientY - z.panStartY;
        applyZoom();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const z = zoomState.current;
      if (e.touches.length < 2) z.isPinching = false;
      if (e.touches.length === 0) {
        z.isPanning = false;
        // Snap back to 1× if nearly reset
        if (z.scale < 1.08) {
          z.scale = 1; z.tx = 0; z.ty = 0;
          applyZoom();
        }
      }
    };

    wrap.addEventListener("touchstart", onTouchStart, { passive: true });
    wrap.addEventListener("touchmove", onTouchMove, { passive: false });
    wrap.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      wrap.removeEventListener("touchstart", onTouchStart);
      wrap.removeEventListener("touchmove", onTouchMove);
      wrap.removeEventListener("touchend", onTouchEnd);
    };
  }, [lightboxImg]);
  // ──────────────────────────────────────────────────────────────────────────

  const handleInstallClick = async () => {
    if (window.deferredPwaInstallPrompt) {
      try {
        await window.deferredPwaInstallPrompt.prompt();
        const choice = await window.deferredPwaInstallPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setInstallSuccess(true);
        }
        window.deferredPwaInstallPrompt = null;
        setCanPrompt(false);
      } catch (err) {
        console.warn("Install error:", err);
      }
    }
  };

  return (
    <div className="editorial-page-container" dir={isUg ? "ltr" : "rtl"}>
      <header className="editorial-header">
        <span className="eyebrow">{isUg ? "Қачила Қолланмиси" : "قاچىلاش قوللانمىسى"}</span>
        <h1>
          {isUg
            ? "Өтүкән Тор Әпини (PWA) Тېلېفون ياكى Kompyuterga Қачилаڭ"
            : "ئۆتۈكەن تور ئەپىنى (PWA) يانفون ياكى كومپيۇتېرىڭىزغا قاچىلاڭ"}
        </h1>
        <p>
          {isUg
            ? "Өтүкәنني әп сүпитидә қоллиниш арқилиқ тез оқуش، торсиз кириш вә йеңи язмилардин дәрһал хәвәрдар болуش имканийитигә егә болуң."
            : "ئۆتۈكەننى ئەپ سۈپىتىدە قاچىلاپ، يېڭى ئانالىز ۋە تەتقىقاتلاردىن دەرھال خەۋەردار بولۇڭ ھەمدە تېخىمۇ راۋان، تېز ئوقۇش تەجرىبىسىدىن بەھرىمەن بولۇڭ."}
        </p>
      </header>

      {/* Feature Highlights: Symmetrical Equal-Height 3-Card Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div className="editorial-card" style={{ padding: "20px", margin: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--wine)", marginBottom: "8px" }}>
            <Zap size={22} />
            <strong style={{ fontSize: "16px", color: "var(--ink)" }}>{isUg ? "Тез Йүклиниш" : "دەرھال يۈكلىنىش"}</strong>
          </div>
          <p style={{ fontSize: "14px", margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
            {isUg
              ? "Әп кэш технологияси арқилиқ сәһипиләр көз йумғучә ачилиду."
              : "كەشكە ئالدىن ساقلاش تېخنىكىسى بىلەن بەتلەر كۆز يۇمۇپ ئاچقۇچە ئېچىلىدۇ."}
          </p>
        </div>

        <div className="editorial-card" style={{ padding: "20px", margin: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--wine)", marginBottom: "8px" }}>
            <WifiOff size={22} />
            <strong style={{ fontSize: "16px", color: "var(--ink)" }}>{isUg ? "Торсиз Көрүش" : "تورسىزمۇ ئوقۇش"}</strong>
          </div>
          <p style={{ fontSize: "14px", margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
            {isUg
              ? "Интернетиңиз үзүлүп қалсиму алдин оқулған язмилар сақлиниду."
              : "تور بولمىغان ياكى سىگنال ناچار چاغلاردىمۇ ئىلگىرى كۆرۈلگەن يازمىلارنى ئوقۇغىلى بولىدۇ."}
          </p>
        </div>

        <div className="editorial-card" style={{ padding: "20px", margin: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--wine)", marginBottom: "8px" }}>
            <Bell size={22} />
            <strong style={{ fontSize: "16px", color: "var(--ink)" }}>{isUg ? "Дәрһал Уқтуруش" : "دەرھال ئۇقتۇرۇش"}</strong>
          </div>
          <p style={{ fontSize: "14px", margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
            {isUg
              ? "Йеңи анализ вә китаплар елан қилинғанда биринчи болуп биләйсүз."
              : "يېڭى ئانالىز ۋە تەتقىقاتلار ئېلان قىلىنغان ھامان تېلېفونىڭىزغا خەۋەر كېلىدۇ."}
          </p>
        </div>
      </div>

      {/* Push Notification Toggle Strip */}
      <div style={{ marginBottom: "32px" }}>
        <PushSubscriber isUg={isUg} />
      </div>

      {/* Direct Install CTA button if available */}
      {canPrompt && (
        <div
          className="editorial-card"
          style={{
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(104,21,42,0.06), rgba(244,180,26,0.06))",
            borderColor: "var(--wine)",
            marginBottom: "32px",
          }}
        >
          <h2 style={{ border: "none", margin: "0 0 10px 0" }}>
            {isUg ? "Тор Бравзериңиз Қачилашқа Тәййар!" : "تور كۆرگۈچىڭىز قاچىلاشقا تەييار!"}
          </h2>
          <p style={{ maxWidth: 540, margin: "0 auto 20px auto" }}>
            {isUg
              ? "Төмәндики түгмини бесип Өтүкән әпини дәрһал қачилавалиң."
              : "تۆۋەندىكى تۈگمىنى بېسىش ئارقىلىق ئۆتۈكەن ئەپىنى بىۋاسىتە قاچىلىۋالالايسىز."}
          </p>
          <button
            type="button"
            className="btn-submit"
            onClick={handleInstallClick}
            style={{ fontSize: "16px", padding: "14px 32px" }}
          >
            <Download size={20} />
            <span>{isUg ? "Һазир Қачилаш" : "ھازىر قاچىلاش"}</span>
          </button>
        </div>
      )}

      {installSuccess && (
        <div
          className="editorial-card"
          style={{
            background: "#f0fdf4",
            borderColor: "#86efac",
            color: "#166534",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <CheckCircle2 size={24} />
          <strong>
            {isUg
              ? "Әп мувәппәқийәтлик қачиланди! Баш экраниңиздин ачалايсиз."
              : "ئەپ مۇۋەپپەقىيەتلىك قاچىلاندى! باش ئېكرانىڭىزدىن ئاچالايسىز."}
          </strong>
        </div>
      )}

      {/* Device Instructions Section */}
      <div className="editorial-card">
        <h2>{isUg ? "Қәдәмму-Қәдәм Қачилаش Қолланмиси" : "قەدەممۇ-قەدەم قاچىلاش تەرتىپى"}</h2>

        {/* Device Switcher Tabs */}
        <div className="device-tabs">
          <button
            type="button"
            className={`device-tab-btn ${activeTab === "ios" ? "active" : ""}`}
            onClick={() => setActiveTab("ios")}
          >
            <Apple size={17} />
            <span>iPhone / iPad (iOS)</span>
          </button>
          <button
            type="button"
            className={`device-tab-btn ${activeTab === "android" ? "active" : ""}`}
            onClick={() => setActiveTab("android")}
          >
            <Smartphone size={17} />
            <span>Android (Chrome)</span>
          </button>
          <button
            type="button"
            className={`device-tab-btn ${activeTab === "desktop" ? "active" : ""}`}
            onClick={() => setActiveTab("desktop")}
          >
            <Monitor size={17} />
            <span>{isUg ? "Kompyuter (Chrome / Edge / Safari)" : "كومپيۇتېر (Chrome / Edge / Safari)"}</span>
          </button>
        </div>

        {/* Tab 1: iOS Instructions (Balanced 2-Column Split) */}
        {activeTab === "ios" && (
          <>
            <div className="install-step-list">
              <div className="install-step-item">
                <span className="install-step-num">1</span>
                <div className="install-step-text">
                  <h3>{isUg ? "1. Сафари (Safari) йаки Chrome бравзерини ачиң" : "1. سافارى (Safari) ياكى Chrome تور كۆرگۈچىنى ئېچىڭ"}</h3>
                  <p>
                    {isUg
                      ? "iPhone йаки iPad ңызда Өтүкән تور бетини Сафари йаки Google Chrome (iOS 16.4+) арқилиқ ечиң."
                      : "iPhone ياكى iPad ئۈسكۈنىڭىزدە ئۆتۈكەن تور بېتىنى Safari ياكى Google Chrome (iOS 16.4+) ئارقىلىق ئېچىڭ."}
                  </p>
                </div>
              </div>

              <div className="install-step-item">
                <span className="install-step-num">2</span>
                <div className="install-step-text">
                  <h3>
                    {isUg
                      ? "2. Төмәндики [Һәмбәһирләش] түгүсини бесиң"
                      : "2. ئاستىدىكى «ھەمبەھىرلەش» سىنبەلگىسىنى بېسىڭ"}
                  </h3>
                  <p>
                    {isUg
                      ? "Екранниң төвәндики бөлимидики квадрат үстигә йолланған йа شەкиллик «Һәмбәһирләش (Share)» түгүсини басың."
                      : "ئېكراننىڭ ئاستىدا تۇرغان «ھەمبەھىرلەش (Share)» سىنبەلگىسىنى بېسىڭ (Chrome دا بولسا تىزىملىكتىن Share نى تاللاڭ)."}
                  </p>
                </div>
              </div>

              <div className="install-step-item">
                <span className="install-step-num">3</span>
                <div className="install-step-text">
                  <h3>
                    {isUg
                      ? "3. «Баш экранға қошуش»ни таллаң"
                      : "3. «باش ئېكرانغا قوشۇش» تاللانمىسىنى بېسىڭ"}
                  </h3>
                  <p>
                    {isUg
                      ? "Чиққан менюдин төвәнгә сүрүп «Баш экранға қошуش (Add to Home Screen)» дегән йәрни бесиң."
                      : "چىققان تىزىملىكتىن تۆۋەنگە سىيرىپ «باش ئېكرانغا قوشۇش (Add to Home Screen)» تاللانمىسىنى بېسىڭ."}
                  </p>
                </div>
              </div>

              <div className="install-step-item">
                <span className="install-step-num">4</span>
                <div className="install-step-text">
                  <h3>{isUg ? "4. «Қошуش»ни бесиң" : "4. «قوشۇش»نى بېسىڭ"}</h3>
                  <p>
                    {isUg
                      ? "Оң үстидики «Қошуش (Add)» түгүсини бесиң. Өтүкән сөлбәلгиси тېلېфониңيزниң баш экраниға қошулиду."
                      : "ئوڭ ئۈستىدىكى «قوشۇش (Add)» كۇنۇپكىسىنى بېسىڭ. ئۆتۈكەن سىنبەلگىسى باش ئېكرانىڭىزغا ئەپ شەكلىدە قوشۇلىدۇ."}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Guide Card: 100% width, natural ratio, modalbox on click */}
            <div className="pwa-fullwidth-mockup-card">
              <div className="pwa-fullwidth-header">
                <div className="pwa-fullwidth-title">
                  <Sparkles size={16} style={{ color: "var(--gold)" }} />
                  <span>
                    {isUg
                      ? "Мушу рәсимлик өрнәктин қәдәм баскучларни көрүп үлгә алалайсиз:"
                      : "مۇشۇ رەسىملىك ئۆرنەكتىن قەدەم باسقۇچلارنى كۆرۈپ ئۈلگە ئالالايسىز:"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxImg({
                      src: "/images/pwa/how-to-install-a-pwa-on-ios.webp",
                      alt: isUg ? "iOS PWA Көрсәтмә" : "iOS PWA كۆرسەتمە",
                    })
                  }
                  className="pwa-fullwidth-zoom-btn"
                  title={isUg ? "Чоңайтып көрۈش" : "چوڭايتىپ كۆرۈش"}
                >
                  <Maximize2 size={13} />
                  <span>{isUg ? "Чоңайтып көрۈш" : "چوڭايتىپ كۆرۈش"}</span>
                </button>
              </div>

              <div
                className="pwa-fullwidth-img-box"
                onClick={() =>
                  setLightboxImg({
                    src: "/images/pwa/how-to-install-a-pwa-on-ios.webp",
                    alt: isUg ? "iOS PWA Көрсәтмә" : "iOS PWA كۆرسەتمە",
                  })
                }
                title={isUg ? "Чоңайтып көрۈش ئۈچۈن بېسىڭ" : "چوڭايتىپ كۆرۈش ئۈچۈن چېكىڭ"}
              >
                <img
                  src="/images/pwa/how-to-install-a-pwa-on-ios.webp"
                  alt={isUg ? "iPhone/iPad PWA қачилаш өрники" : "iPhone/iPad PWA قاچىلاش رەسىملىك ئۆرنىكى"}
                  className="pwa-fullwidth-img"
                  loading="lazy"
                />
              </div>
            </div>
          </>
        )}


        {/* Tab 2: Android Instructions */}
        {activeTab === "android" && (
          <>
            <div className="install-step-list">
              <div className="install-step-item">
                <span className="install-step-num">1</span>
                <div className="install-step-text">
                  <h3>{isUg ? "1. Chrome йаки бравзерни ачиң" : "1. Chrome ياكى سىستېما كۆرگۈچىنى ئېچىڭ"}</h3>
                  <p>
                    {isUg
                      ? "Android تېлېفоنيڭизда Google Chrome йаки Samsung Internet арқилиқ тор бетимизгә кириң."
                      : "Android تېلېفونىڭىزدا Google Chrome ياكى Samsung Internet كۆرگۈچى ئارقىلىق كىرىڭ."}
                  </p>
                </div>
              </div>

              <div className="install-step-item">
                <span className="install-step-num">2</span>
                <div className="install-step-text">
                  <h3>
                    {isUg
                      ? "2. Менюни (үч чекит) йаки төвәндики уқтурушни бесиң"
                      : "2. ئۈستىدىكى ئۈچ چېكىت تىزىملىكىنى ياكى ئاستىدىكى ئۇقتۇرۇشنى بېسىڭ"}
                  </h3>
                  <p>
                    {isUg
                      ? "Бравзерниң оң үстидики үч чекитни бесиң йаки екранниң төвәндики «Қачилаш» түгүсини таллаң."
                      : "كۆرگۈچنىڭ ئوڭ ئۈستىدىكى ئۈچ چېكىت تىزىملىكىنى بېسىڭ ياكى ئېكران ئاستىدا كۆرۈنگەن «ئەپنى قاچىلاش» كۇنۇپكىسىنى تاللاڭ."}
                  </p>
                </div>
              </div>

              <div className="install-step-item">
                <span className="install-step-num">3</span>
                <div className="install-step-text">
                  <h3>
                    {isUg
                      ? "3. «Әпни қачилаш»ни таллаң"
                      : "3. «ئەپنى قاچىلاش» ياكى «باش ئېكرانغا قوشۇش»نى بېسىڭ"}
                  </h3>
                  <p>
                    {isUg
                      ? "«Әпни қачилаш (Install App)» дегән түгмини бесип тәстиқлаң."
                      : "«ئەپنى قاچىلاش (Install App)» تۈگمىسىنى بېسىپ مۇئەييەنلەشتۈرۈڭ. ئەپ سېكۇنت ئىچىدە يانفونىڭىزغا قاچىلىنىدۇ."}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Guide Card: 100% width, natural ratio, modalbox on click */}
            <div className="pwa-fullwidth-mockup-card">
              <div className="pwa-fullwidth-header">
                <div className="pwa-fullwidth-title">
                  <Sparkles size={16} style={{ color: "var(--gold)" }} />
                  <span>
                    {isUg
                      ? "Мушу рәсимлик өрнәктин қәдәм баскучларни көрүп үлгә алалайсиз:"
                      : "مۇشۇ رەسىملىك ئۆرنەكتىن قەدەم باسقۇچلارنى كۆرۈپ ئۈلگە ئالالايسىز:"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxImg({
                      src: "/images/pwa/how-to-install-a-pwa-on-android.webp",
                      alt: isUg ? "Android PWA Көрсәтмә" : "Android PWA كۆرسەتمە",
                    })
                  }
                  className="pwa-fullwidth-zoom-btn"
                  title={isUg ? "Чоңайтып көрۈش" : "چوڭايتىپ كۆرۈش"}
                >
                  <Maximize2 size={13} />
                  <span>{isUg ? "Чоңайтып көрۈش" : "چوڭايتىپ كۆرۈش"}</span>
                </button>
              </div>

              <div
                className="pwa-fullwidth-img-box"
                onClick={() =>
                  setLightboxImg({
                    src: "/images/pwa/how-to-install-a-pwa-on-android.webp",
                    alt: isUg ? "Android PWA Көрсәтмә" : "Android PWA كۆرسەتمە",
                  })
                }
                title={isUg ? "Чоңайтып көрۈш ئۈچۈن بېسىڭ" : "چوڭايتىپ كۆرۈش ئۈچۈن چېكىڭ"}
              >
                <img
                  src="/images/pwa/how-to-install-a-pwa-on-android.webp"
                  alt={isUg ? "Android PWA қачилаш өрники" : "Android PWA قاچىلاش رەسىملىك ئۆرنىكى"}
                  className="pwa-fullwidth-img"
                  loading="lazy"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "desktop" && (
          <>
            <div className="install-step-list">
              <div className="install-step-item">
                <span className="install-step-num">1</span>
                <div className="install-step-text">
                  <h3>{isUg ? "1. Адрес тизимидики қачилаш сөлбәлгисини бесиң" : "1. ئادرېس بالدىقىدىكى قاچىلاش سىنبەلگىسىنى بېسىڭ"}</h3>
                  <p>
                    {isUg
                      ? "Google Chrome йаки Microsoft Edge бравзерида сайтни ачқиниңизда, адрес қатириниң оң тәрәпидә «Қачилаш (Install)» сөлбәлгиси чиқиду."
                      : "Google Chrome، Edge ياكى Safari كۆرگۈچلىرىدە ئادرېس بالدىقىنىڭ ئەڭ ئوڭ تەرىپىدە كۆرۈنىدىغان قاچىلاش (Install) سىنبەلگىسىنى چېكىڭ."}
                  </p>
                </div>
              </div>

              <div className="install-step-item">
                <span className="install-step-num">2</span>
                <div className="install-step-text">
                  <h3>{isUg ? "2. «Қачилаш»ни таллаң" : "2. «قاچىلاش»نى بېسىڭ"}</h3>
                  <p>
                    {isUg
                      ? "«Өтүкән әпини қачиласунму?» дегән соалға «Қачилаш (Install)»ни бесиң."
                      : "«قاچىلاش» كۇنۇپكىسىنى بېسىپ جەزملەشتۈرۈڭ. ئەپ ئايرىم دېرىزىدە ئېچىلىدۇ ۋە كومپيۇتېرىڭىزنىڭ ئاساسىي تىزىملىكىگە قوشۇلىدۇ."}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Guide Card: 100% width, natural ratio, modalbox on click */}
            <div className="pwa-fullwidth-mockup-card">
              <div className="pwa-fullwidth-header">
                <div className="pwa-fullwidth-title">
                  <Sparkles size={16} style={{ color: "var(--gold)" }} />
                  <span>
                    {isUg
                      ? "Мушу рәсимлик өрнәктин қәдәм баскучларни көрүп үлгә алалайсиз:"
                      : "مۇشۇ رەسىملىك ئۆرنەكتىن قەدەم باسقۇچلارنى كۆرۈپ ئۈلگە ئالالايسىز:"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxImg({
                      src: "/images/pwa/installing-pwa-on-desktop.webp",
                      alt: isUg ? "Desktop PWA Көрсәтмә" : "Desktop PWA كۆرسەتمە",
                    })
                  }
                  className="pwa-fullwidth-zoom-btn"
                  title={isUg ? "Чоңайтып көрۈш" : "چوڭايتىپ كۆرۈش"}
                >
                  <Maximize2 size={13} />
                  <span>{isUg ? "Чоңайтып көрۈш" : "چوڭايتىپ كۆرۈش"}</span>
                </button>
              </div>

              <div
                className="pwa-fullwidth-img-box"
                onClick={() =>
                  setLightboxImg({
                    src: "/images/pwa/installing-pwa-on-desktop.webp",
                    alt: isUg ? "Desktop PWA Көрсәтмә" : "Desktop PWA كۆرسەتمە",
                  })
                }
                title={isUg ? "Чоңайтып көрۈш ئۈچۈن بېسىڭ" : "چوڭايتىپ كۆرۈش ئۈچۈن چېكىڭ"}
              >
                <img
                  src="/images/pwa/installing-pwa-on-desktop.webp"
                  alt={isUg ? "Kompyuter PWA қачилаш өрники" : "كومپيۇتېر PWA قاچىلاش رەسىملىك ئۆرنىكى"}
                  className="pwa-fullwidth-img"
                  loading="lazy"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Interactive Lightbox Modal — Pinch-to-Zoom + Pan + Double-Tap */}
      {lightboxImg && (
        <div
          className="pwa-lightbox-overlay"
          onClick={() => setLightboxImg(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={lightboxCardRef}
            className="pwa-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Reset zoom button — only visible when zoomed (via .is-zoomed CSS class) */}
            <button
              type="button"
              className="pwa-lightbox-reset-btn"
              onClick={resetZoom}
              title={isUg ? "Яслига Қайтиш (1×)" : "ئەسلىگە قايتۇرۇش (1×)"}
            >
              1×
            </button>

            {/* Close button */}
            <button
              type="button"
              className="pwa-lightbox-close"
              onClick={() => setLightboxImg(null)}
              aria-label={isUg ? "Йепиш" : "تاقاش"}
              title={isUg ? "Йепиш (Esc)" : "تاقاش (Esc)"}
            >
              <X size={20} />
            </button>

            {/* Touch-zoom wrapper */}
            <div ref={lightboxWrapRef} className="pwa-lightbox-zoom-wrapper">
              <img
                ref={lightboxImgRef}
                src={lightboxImg.src}
                alt={lightboxImg.alt}
                className="pwa-lightbox-img"
                draggable={false}
              />
            </div>

            {/* Mobile hint badge */}
            <div className="pwa-lightbox-zoom-hint">
              <ZoomIn size={12} />
              <span>{isUg ? "Чоңайтиш: Икки бармақ بىلән кеңейтиң" : "يېقىنلاشتۇرۇپ كۆرۈش: ئىككى بارماق بىلەن يېقىنلاشتۇرۇپ كۆرلەيسىز"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
