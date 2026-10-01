"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { WPPost, postCategory, postImage, displayDate, localPath } from "@/lib/wordpress-ug";
import { plainText } from "@/lib/content";

export function RelatedCarousel({ posts }: { posts: WPPost[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(posts.length > 1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Mouse drag references
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);

  // Touch tracking references
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchMovedRef = useRef(false);

  function checkScroll() {
    const el = trackRef.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    if (cards.length === 0) return;

    const trackRect = el.getBoundingClientRect();
    const firstRect = cards[0].getBoundingClientRect();
    const lastRect = cards[cards.length - 1].getBoundingClientRect();

    // In LTR, start is on the left, end is on the right
    const atStart = firstRect.left >= trackRect.left - 12;
    const atEnd = lastRect.right <= trackRect.right + 12;

    setCanPrev(!atStart);
    setCanNext(!atEnd);

    // Calculate pages based on visible cards per page
    const firstCard = cards[0];
    const gap = 18;
    const cardStride = firstCard.offsetWidth + gap;
    const visibleCount = Math.max(1, Math.round((el.clientWidth + gap) / cardStride));
    const pages = Math.max(1, Math.ceil(cards.length / visibleCount));
    setTotalPages(pages);

    // Find card closest to start (left edge)
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      const diff = Math.abs(rect.left - trackRect.left);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setActiveIndex(closestIdx);

    if (pages <= 1 || atStart) {
      setCurrentPage(1);
    } else if (atEnd) {
      setCurrentPage(pages);
    } else {
      const maxScroll = el.scrollWidth - el.clientWidth;
      const currentScroll = el.scrollLeft;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, currentScroll / maxScroll)) : 0;
      const pageIndex = 1 + Math.round(progress * (pages - 1));
      setCurrentPage(Math.min(pages, Math.max(1, pageIndex)));
    }
  }

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [posts.length]);

  // Global mousemove and mouseup listeners to ensure smooth drag-and-drop
  useEffect(() => {
    function handleWindowMouseMove(e: MouseEvent) {
      if (!isDownRef.current || !trackRef.current) return;
      const dx = e.clientX - startXRef.current;

      if (!hasMovedRef.current && Math.abs(dx) > 4) {
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
        // In LTR, dragging left (dx < 0) scrolls right (scrollLeft increases)
        trackRef.current.scrollLeft = startScrollLeftRef.current - dx;
      }
    }

    function handleWindowMouseUp() {
      if (!isDownRef.current) return;
      isDownRef.current = false;

      if (hasMovedRef.current && trackRef.current) {
        // Apply smooth momentum if user flicked with mouse
        const v = velocityRef.current;
        if (Math.abs(v) > 0.2) {
          trackRef.current.scrollBy({ left: -v * 280, behavior: "smooth" });
        }
        // Brief timeout so click capture blocks card link navigation
        setTimeout(() => {
          setIsDragging(false);
          hasMovedRef.current = false;
        }, 80);
      } else {
        setIsDragging(false);
        hasMovedRef.current = false;
      }
    }

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, []);

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0 || !trackRef.current) return;
    isDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    startScrollLeftRef.current = trackRef.current.scrollLeft;
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchMovedRef.current = false;
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 1 && !touchMovedRef.current) {
      const dx = Math.abs(e.touches[0].clientX - touchStartXRef.current);
      const dy = Math.abs(e.touches[0].clientY - touchStartYRef.current);
      if (dx > 8 && dx > dy) {
        touchMovedRef.current = true;
      }
    }
  }

  function handleClickCapture(e: React.MouseEvent) {
    if (hasMovedRef.current || touchMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      touchMovedRef.current = false;
    }
  }

  function scroll(direction: "prev" | "next") {
    const el = trackRef.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    if (cards.length === 0) return;

    const firstCard = cards[0];
    const gap = 18;
    const cardStride = firstCard.offsetWidth + gap;
    const visibleCount = Math.max(1, Math.round((el.clientWidth + gap) / cardStride));

    // Scroll by one full page of visible cards
    const step = visibleCount * cardStride;
    const delta = direction === "next" ? step : -step;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  if (!posts || posts.length === 0) return null;

  return (
    <section className="related-carousel-section" aria-label="Мунасивәтлик Йазмилар Көргәзмиси">
      <div className="related-carousel-header">
        <div className="section-heading">
          <h2>Мунасивәтлик Йазмилар</h2>
          <span className="related-count">
            <b dir="ltr">{posts.length}</b> Тәвсийә
          </span>
        </div>

        <div className="carousel-controls" aria-label="Көргәзмә Контроллири">
          <button
            type="button"
            className="carousel-arrow"
            onClick={() => scroll("prev")}
            disabled={!canPrev}
            aria-label="Алдинқи Бәт"
            title="Алдинқи Бәт"
          >
            <ChevronLeft size={15} strokeWidth={2} />
          </button>
          <span className="carousel-page-indicator" dir="ltr" aria-label={`Бәт ${currentPage} / ${totalPages}`}>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="carousel-arrow"
            onClick={() => scroll("next")}
            disabled={!canNext}
            aria-label="Кейинки Бәт"
            title="Кейинки Бәт"
          >
            <ChevronRight size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="carousel-viewport">
        <div
          className={`carousel-track ${isDragging ? "is-dragging" : ""}`}
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onClickCapture={handleClickCapture}
          onDragStart={e => e.preventDefault()}
        >
          {posts.map((post, idx) => {
            const img = postImage(post, 384);
            return (
              <article
                className={`carousel-card ${idx === activeIndex ? "is-active" : ""}`}
                key={post.id}
              >
                <Link
                  href={localPath(post.link)}
                  className={`carousel-photo ${!img ? "photo-empty" : ""}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  draggable={false}
                >
                  {img ? (
                    <img src={img} alt="" loading="lazy" decoding="async" draggable={false} sizes="320px" />
                  ) : (
                    <div className="carousel-no-photo">Өтүкән</div>
                  )}
                </Link>
                <div className="carousel-card-body">
                  <div className="post-meta">
                    <span>{postCategory(post)}</span>
                    <i />
                    <time dateTime={post.date} dir="ltr">
                      {displayDate(post.date)}
                    </time>
                  </div>
                  <h3>
                    <Link href={localPath(post.link)} draggable={false}>
                      {plainText(post.title.rendered)}
                    </Link>
                  </h3>
                  <p className="carousel-excerpt">
                    {plainText(post.excerpt.rendered)}
                  </p>
                  <Link href={localPath(post.link)} className="read-link" draggable={false}>
                    Оқуң <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
