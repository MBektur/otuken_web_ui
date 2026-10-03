"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { WPPost, displayDate, postCategory, postImage, readingMinutes, localPath } from "@/lib/wordpress-ug";
import { plainText } from "@/lib/content";

const AUTOPLAY_INTERVAL = 6000;
const TRANSITION_DURATION = 450; // ms

export function HeroSlider({ posts }: { posts: WPPost[] }) {
  const total = posts.length;

  // Extended slides with clones for infinite loop:
  // [Clone of Last, ...posts, Clone of First]
  const slides = total > 1 ? [posts[total - 1], ...posts, posts[0]] : posts;

  // currentIndex: 1 corresponds to posts[0]
  const [currentIndex, setCurrentIndex] = useState(total > 1 ? 1 : 0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const justDraggedRef = useRef(false);
  const isTransitioningRef = useRef(false);

  // Sync ref with state
  isTransitioningRef.current = isTransitioning;

  // Active dot indicator (0 to total - 1)
  const activeDotIndex = total > 1
    ? (currentIndex - 1 + total) % total
    : 0;

  // Navigate to target index with animation
  const goToIndex = useCallback((targetIndex: number) => {
    if (total <= 1 || isTransitioningRef.current) return;
    setIsTransitioning(true);
    setCurrentIndex(targetIndex);
  }, [total]);

  // In LTR:
  // Next in sequence = currentIndex + 1
  // Prev in sequence = currentIndex - 1
  const goNext = useCallback(() => {
    goToIndex(currentIndex + 1);
  }, [currentIndex, goToIndex]);

  const goPrev = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  // Jump to specific slide from dot indicators
  const goToSlide = useCallback((postIdx: number) => {
    goToIndex(postIdx + 1);
  }, [goToIndex]);

  // Autoplay
  useEffect(() => {
    if (paused || isDragging || total <= 1) return;
    timerRef.current = setInterval(goNext, AUTOPLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, isDragging, goNext, total]);

  // Handle clone boundary reset on transition end
  const handleTransitionEnd = useCallback(() => {
    setIsTransitioning(false);

    if (total > 1) {
      if (currentIndex === 0) {
        // Reached clone of last slide -> jump to real last slide
        setCurrentIndex(total);
      } else if (currentIndex === total + 1) {
        // Reached clone of first slide -> jump to real first slide
        setCurrentIndex(1);
      }
    }
  }, [currentIndex, total]);

  // Keyboard navigation for LTR:
  // Right arrow = Next
  // Left arrow = Prev
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") {
      goNext();
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      goPrev();
      e.preventDefault();
    }
  }

  // Pointer drag & drop (mouse + touch)
  function onPointerDown(e: React.PointerEvent) {
    if (total <= 1) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (isTransitioningRef.current) return;

    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    setIsDragging(true);
    setDragOffset(0);
    setPaused(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragStartRef.current || !isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Release drag if mostly vertical scroll on mobile
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dragOffset) === 0 && Math.abs(dy) > 10) {
      dragStartRef.current = null;
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    setDragOffset(dx);
  }

  const finishDrag = useCallback(() => {
    if (!dragStartRef.current || !isDragging) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const offset = dragOffset;
    const elapsed = Date.now() - dragStartRef.current.time;
    const containerWidth = containerRef.current?.offsetWidth || 600;
    const threshold = Math.min(containerWidth * 0.16, 70);
    const isFlick = elapsed < 300 && Math.abs(offset) > 25;
    const isMoved = Math.abs(offset) > threshold;

    if (isFlick || isMoved) {
      justDraggedRef.current = true;
      setTimeout(() => { justDraggedRef.current = false; }, 250);
      // Dragging left (negative offset) pulls next slide into view
      // Dragging right (positive offset) pulls prev slide into view
      if (offset < 0) {
        goToIndex(currentIndex + 1);
      } else {
        goToIndex(currentIndex - 1);
      }
    } else if (Math.abs(offset) > 5) {
      justDraggedRef.current = true;
      setTimeout(() => { justDraggedRef.current = false; }, 250);
    }

    dragStartRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
    setPaused(false);
  }, [currentIndex, dragOffset, goToIndex, isDragging]);

  function handleLinkClick(e: React.MouseEvent) {
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // Calculate track transform
  const trackStyle = {
    transform: `translate3d(calc(-${currentIndex * 100}% + ${dragOffset}px), 0, 0)`,
    transition: isDragging || !isTransitioning
      ? "none"
      : `transform ${TRANSITION_DURATION}ms cubic-bezier(0.25, 1, 0.5, 1)`,
  };

  return (
    <div
      ref={containerRef}
      className={`hero-slider ${isDragging ? "is-dragging" : ""}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Өтүкәن Нәзири"
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
      {/* Slides Track */}
      <div
        className="hero-slider-track"
        style={trackStyle}
        onTransitionEnd={handleTransitionEnd}
      >
        {slides.map((post, idx) => {
          const src = postImage(post, 1080, 80);
          const isCurrent = idx === currentIndex;
          return (
            <article
              key={`${post.id}-${idx}`}
              className={`hero-slide ${isCurrent ? "is-active" : ""}`}
              dir="ltr"
              role="group"
              aria-roledescription="slide"
              aria-label={`${activeDotIndex + 1} / ${total}`}
              aria-hidden={!isCurrent}
            >
              {/* Background image */}
              <div className="hero-slide-bg">
                {src && (
                  <img
                    src={src}
                    alt=""
                    loading={idx <= 2 ? "eager" : "lazy"}
                    fetchPriority={idx === 1 ? "high" : "auto"}
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
                  {post.youtubeId && (
                    <span className="podcast-pill">
                      <Play size={10} fill="currentColor" /> Син
                    </span>
                  )}
                  <i />
                  <time dateTime={post.date} dir="ltr">{displayDate(post.date)}</time>
                </div>
                <h2>
                  <Link
                    href={localPath(post.link)}
                    prefetch={true}
                    tabIndex={isCurrent ? 0 : -1}
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
                    {readingMinutes(post)} Минут Оқуш
                  </span>
                  <Link
                    href={localPath(post.link)}
                    className="hero-slide-cta"
                    prefetch={true}
                    tabIndex={isCurrent ? 0 : -1}
                    onClick={handleLinkClick}
                  >
                    Давамини Оқуң
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Navigation arrows (LTR: Left button = Prev, Right button = Next) */}
      {total > 1 && (
        <>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-arrow-left"
            onClick={goPrev}
            aria-label="Алдинқи"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-arrow-right"
            onClick={goNext}
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
              className={`hero-slider-dot ${idx === activeDotIndex ? "is-active" : ""}`}
              aria-selected={idx === activeDotIndex}
              aria-label={`${idx + 1}-Йазма`}
              onClick={() => goToSlide(idx)}
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
            key={activeDotIndex}
          />
        </div>
      )}
    </div>
  );
}
