"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { WPPost, displayDate, postCategory, postImage, readingMinutes } from "@/lib/wordpress";
import { localPath, plainText } from "@/lib/content";

const AUTOPLAY_INTERVAL = 6000;

export function HeroSlider({ posts }: { posts: WPPost[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const justDraggedRef = useRef(false);
  const total = posts.length;

  const goTo = useCallback((idx: number) => {
    setActive(((idx % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  // Autoplay
  useEffect(() => {
    if (paused || isDragging || total <= 1) return;
    timerRef.current = setInterval(next, AUTOPLAY_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, isDragging, next, total]);

  // Keyboard navigation for RTL: Left arrow = Next (advance), Right arrow = Prev (go back)
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") { next(); e.preventDefault(); }
    if (e.key === "ArrowRight") { prev(); e.preventDefault(); }
  }

  // Pointer drag & drop (mouse + finger)
  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    setIsDragging(true);
    setDragOffset(0);
    setPaused(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // If initial gesture is vertical scroll, release drag
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dragOffset) === 0 && Math.abs(dy) > 8) {
      dragStartRef.current = null;
      setIsDragging(false);
      return;
    }

    // Dampen drag resistance
    const damped = Math.sign(dx) * Math.min(Math.abs(dx), 240);
    setDragOffset(damped);
  }

  const finishDrag = useCallback(() => {
    if (!dragStartRef.current) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    const offset = dragOffset;
    const elapsed = Date.now() - dragStartRef.current.time;
    const isFlick = elapsed < 320 && Math.abs(offset) > 25;
    const isMoved = Math.abs(offset) > 55;

    if (isFlick || isMoved) {
      justDraggedRef.current = true;
      setTimeout(() => { justDraggedRef.current = false; }, 250);
      // RTL: dragging left (offset < 0) advances to next, dragging right (offset > 0) goes to prev
      if (offset < 0) next(); else prev();
    } else if (Math.abs(offset) > 6) {
      justDraggedRef.current = true;
      setTimeout(() => { justDraggedRef.current = false; }, 250);
    }

    dragStartRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
    setPaused(false);
  }, [dragOffset, next, prev]);

  function handleLinkClick(e: React.MouseEvent) {
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return (
    <div
      className={`hero-slider ${isDragging ? "is-dragging" : ""}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="ئالاھىدە يازمىلار"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { if (!isDragging) setPaused(false); }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      tabIndex={0}
    >
      {/* Slides */}
      <div
        className="hero-slider-track"
        style={{
          transform: dragOffset !== 0 ? `translateX(${dragOffset}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.2, 0.8, 0.4, 1)",
        }}
      >
        {posts.map((post, idx) => {
          const src = postImage(post, 1080, 80);
          const isActive = idx === active;
          return (
            <article
              key={post.id}
              className={`hero-slide ${isActive ? "is-active" : ""}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} / ${total}`}
              aria-hidden={!isActive}
            >
              {/* Background image */}
              <div className="hero-slide-bg">
                {src && (
                  <img
                    src={src}
                    alt=""
                    loading={idx === 0 ? "eager" : "lazy"}
                    fetchPriority={idx === 0 ? "high" : "auto"}
                    decoding="async"
                    draggable={false}
                  />
                )}
                <div className="hero-slide-overlay" />
              </div>

              {/* Content */}
              <div className="hero-slide-content">
                <div className="hero-slide-meta">
                  <span>{postCategory(post)}</span>
                  {post.youtubeId && <span className="podcast-pill"><Play size={10} fill="currentColor" /> سىن</span>}
                  <i />
                  <time dateTime={post.date} dir="ltr">{displayDate(post.date)}</time>
                </div>
                <h2>
                  <Link
                    href={localPath(post.link)}
                    prefetch={true}
                    tabIndex={isActive ? 0 : -1}
                    onClick={handleLinkClick}
                  >
                    {plainText(post.title.rendered)}
                  </Link>
                </h2>
                <p>{plainText(post.excerpt.rendered)}</p>
                <div className="hero-slide-footer">
                  <span className="hero-slide-author">
                    {post._embedded?.author?.[0]?.name}
                    <i />
                    {readingMinutes(post)} مىنۇت ئوقۇش
                  </span>
                  <Link
                    href={localPath(post.link)}
                    className="hero-slide-cta"
                    prefetch={true}
                    tabIndex={isActive ? 0 : -1}
                    onClick={handleLinkClick}
                  >
                    داۋامىنى ئوقۇڭ
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Navigation arrows (RTL: Left arrow = Next, Right arrow = Prev) */}
      {total > 1 && (
        <>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-arrow-left"
            onClick={next}
            aria-label="كېيىنكى"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-arrow-right"
            onClick={prev}
            aria-label="ئالدىنقى"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="hero-slider-dots" role="tablist" aria-label="يازمىلار سانى">
          {posts.map((_, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              className={`hero-slider-dot ${idx === active ? "is-active" : ""}`}
              aria-selected={idx === active}
              aria-label={`${idx + 1}-يازما`}
              onClick={() => goTo(idx)}
            />
          ))}
        </div>
      )}

      {/* Autoplay progress bar */}
      {total > 1 && (
        <div className="hero-slider-progress">
          <div
            className={`hero-slider-progress-bar ${!paused && !isDragging ? "is-running" : ""}`}
            style={{ animationDuration: `${AUTOPLAY_INTERVAL}ms` }}
            key={active}
          />
        </div>
      )}
    </div>
  );
}
