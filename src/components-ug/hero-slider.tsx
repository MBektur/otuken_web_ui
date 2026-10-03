"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { WPPost, displayDate, postCategory, postImage, readingMinutes, localPath } from "@/lib/wordpress-ug";
import { plainText } from "@/lib/content";

const AUTOPLAY_INTERVAL = 6000;

export function HeroSlider({ posts }: { posts: WPPost[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = posts.length;

  const goTo = useCallback((idx: number) => {
    setActive(((idx % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  // Autoplay
  useEffect(() => {
    if (paused || total <= 1) return;
    timerRef.current = setInterval(next, AUTOPLAY_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, next, total]);

  // Pause on hover / focus
  const handlers = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocusCapture: () => setPaused(true),
    onBlurCapture: () => setPaused(false),
  };

  // Keyboard navigation
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") { next(); e.preventDefault(); }
    if (e.key === "ArrowLeft") { prev(); e.preventDefault(); }
  }

  // Touch swipe
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
    if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
      // LTR: swipe left = next, swipe right = prev
      if (dx < 0) next(); else prev();
    }
    touchStartRef.current = null;
  }

  return (
    <div
      className="hero-slider"
      role="region"
      aria-roledescription="carousel"
      aria-label="Алаһидә Йазмилар"
      {...handlers}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
    >
      {/* Slides */}
      <div className="hero-slider-track">
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
                  {post.youtubeId && <span className="podcast-pill"><Play size={10} fill="currentColor" /> Син</span>}
                  <i />
                  <time dateTime={post.date} dir="ltr">{displayDate(post.date)}</time>
                </div>
                <h2>
                  <Link href={localPath(post.link)} prefetch={true} tabIndex={isActive ? 0 : -1}>
                    {plainText(post.title.rendered)}
                  </Link>
                </h2>
                <p>{plainText(post.excerpt.rendered)}</p>
                <div className="hero-slide-footer">
                  <span className="hero-slide-author">
                    {post._embedded?.author?.[0]?.name}
                    <i />
                    {readingMinutes(post)} Минут Оқуш
                  </span>
                  <Link href={localPath(post.link)} className="hero-slide-cta" prefetch={true} tabIndex={isActive ? 0 : -1}>
                    Давамини Оқуң
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-prev"
            onClick={prev}
            aria-label="Алдинқи"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-next"
            onClick={next}
            aria-label="Кейинки"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="hero-slider-dots" role="tablist" aria-label="Йазмилар Саниғи">
          {posts.map((_, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              className={`hero-slider-dot ${idx === active ? "is-active" : ""}`}
              aria-selected={idx === active}
              aria-label={`${idx + 1}-Йазма`}
              onClick={() => goTo(idx)}
            />
          ))}
          {/* Progress bar for current slide autoplay */}
          <div className="hero-slider-progress">
            <div
              className={`hero-slider-progress-bar ${!paused ? "is-running" : ""}`}
              style={{ animationDuration: `${AUTOPLAY_INTERVAL}ms` }}
              key={active}
            />
          </div>
        </div>
      )}
    </div>
  );
}
