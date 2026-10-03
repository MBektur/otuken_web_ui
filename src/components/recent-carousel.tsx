"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WPPost, postCategory, postImage, displayDate } from "@/lib/wordpress";
import { localPath, plainText } from "@/lib/content";

const AUTOPLAY_INTERVAL = 4000; // 3 saniyede bir

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

  // Mouse drag references
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const justDraggedRef = useRef(false);

  // Touch tracking
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

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

  // Autoplay: 3 saniyede bir 1 card ilerlet
  useEffect(() => {
    if (isPaused || isDragging || sortedPosts.length <= 1) return;
    const timer = setInterval(() => {
      scrollOneCard("next");
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, isDragging, scrollOneCard, sortedPosts.length]);

  // Mouse Drag handlers
  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0 || !trackRef.current) return;
    isDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    startScrollLeftRef.current = trackRef.current.scrollLeft;
    setIsPaused(true);
  }

  useEffect(() => {
    function handleWindowMouseMove(e: MouseEvent) {
      if (!isDownRef.current || !trackRef.current) return;
      const dx = e.clientX - startXRef.current;

      if (!hasMovedRef.current && Math.abs(dx) > 5) {
        hasMovedRef.current = true;
        setIsDragging(true);
      }

      if (hasMovedRef.current) {
        const now = performance.now();
        const dt = now - lastTimeRef.current;
        if (dt > 10) {
          velocityRef.current = (e.clientX - lastXRef.current) / dt;
          lastXRef.current = e.clientX;
          lastTimeRef.current = now;
        }
        trackRef.current.scrollLeft = startScrollLeftRef.current - dx;
      }
    }

    function handleWindowMouseUp() {
      if (!isDownRef.current) return;
      isDownRef.current = false;

      if (hasMovedRef.current && trackRef.current) {
        justDraggedRef.current = true;
        setTimeout(() => { justDraggedRef.current = false; }, 250);

        const v = velocityRef.current;
        if (Math.abs(v) > 0.25) {
          trackRef.current.scrollBy({ left: -v * 240, behavior: "smooth" });
        }
        setTimeout(() => {
          setIsDragging(false);
          hasMovedRef.current = false;
        }, 80);
      } else {
        setIsDragging(false);
        hasMovedRef.current = false;
      }
      setIsPaused(false);
    }

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, []);

  // Touch Swipe handlers
  function handleTouchStart(e: React.TouchEvent) {
    if (!trackRef.current) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    setIsPaused(true);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    setIsPaused(false);
    if (!trackRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartYRef.current);
    if (Math.abs(dx) > 35 && Math.abs(dx) > dy) {
      justDraggedRef.current = true;
      setTimeout(() => { justDraggedRef.current = false; }, 250);
      // RTL: swipe left = next, swipe right = prev
      if (dx < 0) {
        scrollOneCard("next");
      } else {
        scrollOneCard("prev");
      }
    }
  }

  function handleClickCapture(e: React.MouseEvent) {
    if (justDraggedRef.current || isDragging) {
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
      onMouseLeave={() => { if (!isDownRef.current) setIsPaused(false); }}
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
          onTouchEnd={handleTouchEnd}
          onClickCapture={handleClickCapture}
          onDragStart={e => e.preventDefault()}
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
                    <Link href={localPath(post.link)} prefetch={true}>
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
                    <Link href={localPath(post.link)} className="read-link">
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
