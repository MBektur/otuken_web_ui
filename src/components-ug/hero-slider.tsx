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

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mouse & Touch drag tracking refs
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentDxRef = useRef(0);
  const startTimeRef = useRef(0);
  const hasMovedRef = useRef(false);
  const justDraggedRef = useRef(false);
  const scrollLockedRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const currentIndexRef = useRef(currentIndex);

  // Keep refs in sync
  isTransitioningRef.current = isTransitioning;
  currentIndexRef.current = currentIndex;

  // Active dot indicator (0 to total - 1)
  const activeDotIndex = total > 1 ? (currentIndex - 1 + total) % total : 0;

  // Apply track transform with or without CSS transition
  const setTrackTransform = useCallback((percent: number, offsetPx = 0, animate = true) => {
    if (!trackRef.current) return;
    if (animate) {
      trackRef.current.style.transition = `transform ${TRANSITION_DURATION}ms cubic-bezier(0.25, 1, 0.5, 1)`;
    } else {
      trackRef.current.style.transition = "none";
    }
    const offsetStr = offsetPx !== 0 ? ` + ${offsetPx}px` : "";
    trackRef.current.style.transform = `translate3d(calc(-${percent}%${offsetStr}), 0, 0)`;
  }, []);

  // Navigate to target slide index
  const goToIndex = useCallback(
    (targetIndex: number) => {
      if (total <= 1) return;
      setIsTransitioning(true);
      setCurrentIndex(targetIndex);
      setTrackTransform(targetIndex * 100, 0, true);
    },
    [total, setTrackTransform]
  );

  // In LTR:
  // Next in sequence = currentIndex + 1
  // Prev in sequence = currentIndex - 1
  const goNext = useCallback(() => {
    goToIndex(currentIndexRef.current + 1);
  }, [goToIndex]);

  const goPrev = useCallback(() => {
    goToIndex(currentIndexRef.current - 1);
  }, [goToIndex]);

  // Jump to specific slide from dots
  const goToSlide = useCallback(
    (postIdx: number) => {
      goToIndex(postIdx + 1);
    },
    [goToIndex]
  );

  // Autoplay timer
  useEffect(() => {
    if (paused || isDragging || total <= 1) return;
    timerRef.current = setInterval(goNext, AUTOPLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, isDragging, goNext, total]);

  // Handle clone boundary reset on transition end (seamless infinite loop)
  const handleTransitionEnd = useCallback(() => {
    setIsTransitioning(false);

    if (total > 1) {
      if (currentIndex === 0) {
        // Reached clone of last slide -> jump to real last slide without animation
        setCurrentIndex(total);
        setTrackTransform(total * 100, 0, false);
      } else if (currentIndex === total + 1) {
        // Reached clone of first slide -> jump to real first slide without animation
        setCurrentIndex(1);
        setTrackTransform(100, 0, false);
      }
    }
  }, [currentIndex, total, setTrackTransform]);

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

  // Prevent link click when dragged
  function handleLinkClick(e: React.MouseEvent) {
    if (justDraggedRef.current || hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // Block native dragging of images & links
  function preventNativeDrag(e: React.DragEvent) {
    e.preventDefault();
  }

  // ── MOUSE DRAG HANDLERS ───────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (total <= 1 || e.button !== 0) return;

      isDraggingRef.current = true;
      hasMovedRef.current = false;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      currentDxRef.current = 0;
      startTimeRef.current = performance.now();
      setPaused(true);

      // Disable transition while dragging
      if (trackRef.current) {
        trackRef.current.style.transition = "none";
      }

      function onMouseMove(moveEvent: MouseEvent) {
        if (!isDraggingRef.current) return;
        const dx = moveEvent.clientX - startXRef.current;

        if (!hasMovedRef.current && Math.abs(dx) > 4) {
          hasMovedRef.current = true;
          setIsDragging(true);
        }

        if (hasMovedRef.current) {
          moveEvent.preventDefault();
          currentDxRef.current = dx;
          setTrackTransform(currentIndexRef.current * 100, dx, false);
        }
      }

      function onMouseUp() {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);

        if (hasMovedRef.current) {
          justDraggedRef.current = true;
          // Capture and swallow any click events from this drag gesture
          const captureClick = (evt: MouseEvent) => {
            evt.preventDefault();
            evt.stopPropagation();
            window.removeEventListener("click", captureClick, true);
          };
          window.addEventListener("click", captureClick, true);
          setTimeout(() => {
            window.removeEventListener("click", captureClick, true);
            justDraggedRef.current = false;
            hasMovedRef.current = false;
          }, 250);

          const dx = currentDxRef.current;
          const elapsed = performance.now() - startTimeRef.current;
          const containerWidth = containerRef.current?.offsetWidth || 600;
          const threshold = Math.min(containerWidth * 0.16, 75);
          const isFlick = elapsed < 320 && Math.abs(dx) > 25;

          if (Math.abs(dx) > threshold || isFlick) {
            if (dx < 0) {
              goNext();
            } else {
              goPrev();
            }
          } else {
            // Snap back to current slide
            setTrackTransform(currentIndexRef.current * 100, 0, true);
          }
        }

        setPaused(false);
      }

      window.addEventListener("mousemove", onMouseMove, { passive: false });
      window.addEventListener("mouseup", onMouseUp);
    },
    [total, goNext, goPrev, setTrackTransform]
  );

  // ── TOUCH GESTURE HANDLERS (FINGER / MOBILE) ───────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (total <= 1 || e.touches.length > 1) return;

      const touch = e.touches[0];
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      scrollLockedRef.current = false;
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      currentDxRef.current = 0;
      startTimeRef.current = performance.now();
      setPaused(true);

      if (trackRef.current) {
        trackRef.current.style.transition = "none";
      }
    },
    [total]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length > 1) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startXRef.current;
      const dy = touch.clientY - startYRef.current;

      // Determine swipe intent
      if (!scrollLockedRef.current) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 7) {
          // Primarily vertical scroll: abort slider drag to allow natural page scroll
          isDraggingRef.current = false;
          setIsDragging(false);
          setTrackTransform(currentIndexRef.current * 100, 0, true);
          return;
        }
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
          scrollLockedRef.current = true;
          hasMovedRef.current = true;
          setIsDragging(true);
        }
      }

      if (scrollLockedRef.current) {
        currentDxRef.current = dx;
        setTrackTransform(currentIndexRef.current * 100, dx, false);
      }
    },
    [setTrackTransform]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (hasMovedRef.current) {
      justDraggedRef.current = true;
      setTimeout(() => {
        justDraggedRef.current = false;
        hasMovedRef.current = false;
      }, 250);

      const dx = currentDxRef.current;
      const elapsed = performance.now() - startTimeRef.current;
      const containerWidth = containerRef.current?.offsetWidth || 600;
      const threshold = Math.min(containerWidth * 0.16, 75);
      const isFlick = elapsed < 320 && Math.abs(dx) > 25;

      if (Math.abs(dx) > threshold || isFlick) {
        if (dx < 0) {
          goNext();
        } else {
          goPrev();
        }
      } else {
        // Snap back to current slide
        setTrackTransform(currentIndexRef.current * 100, 0, true);
      }
    }

    setPaused(false);
  }, [goNext, goPrev, setTrackTransform]);

  return (
    <div
      ref={containerRef}
      className={`hero-slider ${isDragging ? "is-dragging" : ""}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Өтүкән Нәзири"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        if (!isDragging) setPaused(false);
      }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onDragStart={preventNativeDrag}
      tabIndex={0}
    >
      {/* Slides Track */}
      <div
        ref={trackRef}
        className="hero-slider-track"
        style={{
          transform: `translate3d(-${currentIndex * 100}%, 0, 0)`,
          transition: isTransitioning
            ? `transform ${TRANSITION_DURATION}ms cubic-bezier(0.25, 1, 0.5, 1)`
            : "none",
        }}
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
                  <time dateTime={post.date} dir="ltr">
                    {displayDate(post.date)}
                  </time>
                </div>
                <h2>
                  <Link
                    href={localPath(post.link)}
                    prefetch={true}
                    tabIndex={isCurrent ? 0 : -1}
                    onClick={handleLinkClick}
                    draggable={false}
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
                    draggable={false}
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
            title="Алдинқи"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-arrow-right"
            onClick={goNext}
            aria-label="Кейинки"
            title="Кейинки"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="hero-slider-dots" role="tablist" aria-label="Йазмиلار Саниғи">
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
