"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WPPost, postCategory, postImage, displayDate } from "@/lib/wordpress";
import { localPath, plainText } from "@/lib/content";

const AUTOPLAY_INTERVAL = 6000; // 6 saniyede bir

export function RecentCarousel({ posts }: { posts: WPPost[] }) {
  // Sort posts strictly by date descending (zamana gore en son yazılar)
  const sortedPosts = [...posts].sort((a, b) => {
    const tA = a.date ? new Date(a.date).getTime() : 0;
    const tB = b.date ? new Date(b.date).getTime() : 0;
    return tB - tA;
  });

  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Drag tracking refs (both Mouse & Touch)
  const isInteractingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const hasMovedRef = useRef(false);
  const justDraggedRef = useRef(false);
  const touchScrollLockedRef = useRef(false);

  // Update dynamic pagination (e.g. 2/3) based on visible cards and scroll progress
  const updatePagination = useCallback(() => {
    const el = trackRef.current;
    if (!el || !el.firstElementChild) return;
    const cards = Array.from(el.children) as HTMLElement[];
    if (cards.length === 0) return;

    const firstCard = cards[0];
    const gap = 20;
    const cardStride = firstCard.offsetWidth + gap;
    const visibleCount = Math.max(1, Math.round((el.clientWidth + gap) / cardStride));
    const pages = Math.max(1, Math.ceil(cards.length / visibleCount));
    setTotalPages(pages);

    const maxScroll = el.scrollWidth - el.clientWidth;
    const current = Math.abs(el.scrollLeft);

    if (pages <= 1 || current <= 8) {
      setCurrentPage(1);
    } else if (current >= maxScroll - 8) {
      setCurrentPage(pages);
    } else {
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, current / maxScroll)) : 0;
      const pageIndex = 1 + Math.round(progress * (pages - 1));
      setCurrentPage(Math.min(pages, Math.max(1, pageIndex)));
    }
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updatePagination();
    el.addEventListener("scroll", updatePagination, { passive: true });
    window.addEventListener("resize", updatePagination);
    return () => {
      el.removeEventListener("scroll", updatePagination);
      window.removeEventListener("resize", updatePagination);
    };
  }, [updatePagination, sortedPosts.length]);

  // Calculate stride of 1 card
  function getSingleCardStride(): number {
    const el = trackRef.current;
    if (!el || !el.firstElementChild) return 260;
    const firstCard = el.firstElementChild as HTMLElement;
    const gap = 20;
    return firstCard.offsetWidth + gap;
  }

  // Scroll by 1 card with smooth easing
  // In RTL: next is negative left, prev is positive left
  const scrollOneCard = useCallback((direction: "next" | "prev") => {
    const el = trackRef.current;
    if (!el) return;
    const stride = getSingleCardStride();
    const maxScroll = el.scrollWidth - el.clientWidth;
    const current = Math.abs(el.scrollLeft);

    if (direction === "next") {
      if (current >= maxScroll - 12) {
        // Loop back to start smoothly
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: -stride, behavior: "smooth" });
      }
    } else {
      if (current <= 12) {
        // Loop to end smoothly
        el.scrollTo({ left: -maxScroll, behavior: "smooth" });
      } else {
        el.scrollBy({ left: stride, behavior: "smooth" });
      }
    }
  }, []);

  // Autoplay: 4 saniyede bir 1 card ilerlet
  useEffect(() => {
    if (isPaused || isDragging || sortedPosts.length <= 1) return;
    const timer = setInterval(() => {
      scrollOneCard("next");
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, isDragging, scrollOneCard, sortedPosts.length]);

  // Pause autoplay when window/tab is hidden
  useEffect(() => {
    function onVisibilityChange() {
      setIsPaused(document.hidden);
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onVisibilityChange);
    window.addEventListener("blur", () => setIsPaused(true));
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onVisibilityChange);
      window.removeEventListener("blur", () => setIsPaused(true));
    };
  }, []);

  // ── MOUSE DRAG HANDLERS ───────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0 || !trackRef.current) return;
    isInteractingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    setIsPaused(true);
  }

  useEffect(() => {
    function handleWindowMouseMove(e: MouseEvent) {
      if (!isInteractingRef.current || !trackRef.current) return;
      const dx = e.clientX - startXRef.current;

      if (!hasMovedRef.current && Math.abs(dx) > 4) {
        hasMovedRef.current = true;
        setIsDragging(true);
      }

      if (hasMovedRef.current) {
        const now = performance.now();
        const dt = now - lastTimeRef.current;
        const stepDelta = e.clientX - lastXRef.current;

        if (dt > 8) {
          velocityRef.current = stepDelta / dt;
          lastXRef.current = e.clientX;
          lastTimeRef.current = now;
        }

        // In RTL: moving left (stepDelta < 0) scrolls towards Next (negative delta)
        trackRef.current.scrollBy({ left: stepDelta });
      }
    }

    function handleWindowMouseUp(e: MouseEvent) {
      if (!isInteractingRef.current) return;
      isInteractingRef.current = false;

      if (hasMovedRef.current && trackRef.current) {
        justDraggedRef.current = true;

        // Block accidental clicks on links after dragging
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
          setIsDragging(false);
        }, 250);

        const totalDx = e.clientX - startXRef.current;
        const v = velocityRef.current;
        const isFlick = Math.abs(v) > 0.28;

        if (Math.abs(totalDx) > 45 || isFlick) {
          // RTL: dragged left (totalDx < 0) = next card, dragged right = prev card
          if (totalDx < 0) {
            scrollOneCard("next");
          } else {
            scrollOneCard("prev");
          }
        }
      } else {
        setIsDragging(false);
        hasMovedRef.current = false;
      }
      setIsPaused(false);
    }

    window.addEventListener("mousemove", handleWindowMouseMove, { passive: false });
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [scrollOneCard]);

  // ── TOUCH GESTURE HANDLERS (FINGER / MOBILE) ───────────────────
  function handleTouchStart(e: React.TouchEvent) {
    if (!trackRef.current || e.touches.length > 1) return;
    const touch = e.touches[0];
    isInteractingRef.current = true;
    hasMovedRef.current = false;
    touchScrollLockedRef.current = false;
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    lastXRef.current = touch.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    setIsPaused(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isInteractingRef.current || !trackRef.current || e.touches.length > 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startXRef.current;
    const dy = touch.clientY - startYRef.current;

    // Check gesture direction if not locked yet
    if (!touchScrollLockedRef.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 7) {
        // Vertical page scroll: let browser handle native scroll
        isInteractingRef.current = false;
        setIsDragging(false);
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5) {
        // Confirmed horizontal swipe: lock to carousel
        touchScrollLockedRef.current = true;
        hasMovedRef.current = true;
        setIsDragging(true);
      }
    }

    if (touchScrollLockedRef.current) {
      const now = performance.now();
      const dt = now - lastTimeRef.current;
      const stepDelta = touch.clientX - lastXRef.current;

      if (dt > 8) {
        velocityRef.current = stepDelta / dt;
        lastXRef.current = touch.clientX;
        lastTimeRef.current = now;
      }

      // In RTL: moving left (stepDelta < 0) scrolls towards Next
      trackRef.current.scrollBy({ left: stepDelta });
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!isInteractingRef.current) return;
    isInteractingRef.current = false;
    setIsPaused(false);

    if (hasMovedRef.current && trackRef.current) {
      justDraggedRef.current = true;
      setTimeout(() => {
        justDraggedRef.current = false;
        hasMovedRef.current = false;
        setIsDragging(false);
      }, 250);

      const touch = e.changedTouches[0];
      const totalDx = touch.clientX - startXRef.current;
      const v = velocityRef.current;
      const isFlick = Math.abs(v) > 0.28 || Math.abs(totalDx) > 35;

      if (isFlick) {
        // RTL: swipe left = next, swipe right = prev
        if (totalDx < 0) {
          scrollOneCard("next");
        } else {
          scrollOneCard("prev");
        }
      }
    } else {
      setIsDragging(false);
    }
  }

  function handleClickCapture(e: React.MouseEvent) {
    if (justDraggedRef.current || isDragging || hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  if (!sortedPosts || sortedPosts.length === 0) return null;

  return (
    <section
      className="recent-carousel-section"
      aria-label="يېقىنقى يازمىلار كۆرگەزمىسى"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        if (!isInteractingRef.current) setIsPaused(false);
      }}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      {/* Header with Title on one side, Link + Page indicator + Arrows on the other */}
      <div className="recent-carousel-header">
        <div className="section-title">
          <h2>يېقىنقى يازمىلار</h2>
        </div>

        {/* Carousel controls with View All link, page count (2/3), and arrows */}
        <div className="recent-carousel-controls" aria-label="كۆرگەزمە كونتروللىرى">
          <Link href="/uy?q=" prefetch={true} className="recent-carousel-all-link">
            ھەممىنى كۆرۈڭ ←
          </Link>

          <span
            className="recent-carousel-page"
            dir="ltr"
            aria-label={`بەت ${currentPage} / ${totalPages}`}
          >
            {currentPage}/{totalPages}
          </span>

          {/* RTL: Right button = Prev, Left button = Next */}
          <button
            type="button"
            className="recent-carousel-arrow"
            onClick={() => scrollOneCard("prev")}
            aria-label="ئالدىنقى يازما"
            title="ئالدىنقى"
          >
            <ChevronRight size={15} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="recent-carousel-arrow"
            onClick={() => scrollOneCard("next")}
            aria-label="كېيىنكى يازما"
            title="كېيىنكى"
          >
            <ChevronLeft size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="recent-carousel-viewport">
        <div
          ref={trackRef}
          className={`recent-carousel-track ${isDragging ? "is-dragging" : ""}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onClickCapture={handleClickCapture}
          onDragStart={(e) => e.preventDefault()}
        >
          {sortedPosts.map((post) => {
            const img = postImage(post, 640, 75);
            return (
              <article className="recent-carousel-card" key={post.id}>
                <Link
                  href={localPath(post.link)}
                  prefetch={true}
                  className={`recent-card-photo ${!img ? "photo-empty" : ""}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  draggable={false}
                  onClick={handleClickCapture}
                >
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      sizes="(max-width: 768px) 85vw, 320px"
                    />
                  ) : (
                    <div className="recent-no-photo">ئۆتۈكەن</div>
                  )}
                </Link>

                <div className="recent-card-body">
                  <div className="post-meta">
                    <span>{postCategory(post)}</span>
                    <i />
                    <time dateTime={post.date} dir="ltr">
                      {displayDate(post.date)}
                    </time>
                  </div>

                  <h3>
                    <Link
                      href={localPath(post.link)}
                      prefetch={true}
                      draggable={false}
                      onClick={handleClickCapture}
                    >
                      {plainText(post.title.rendered)}
                    </Link>
                  </h3>

                  <p className="card-excerpt">
                    {plainText(post.excerpt.rendered)}
                  </p>

                  <div className="recent-card-footer">
                    <span className="recent-card-author">
                      {post._embedded?.author?.[0]?.name}
                    </span>
                    <Link
                      href={localPath(post.link)}
                      className="read-link"
                      draggable={false}
                      onClick={handleClickCapture}
                    >
                      ئوقۇڭ ←
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
