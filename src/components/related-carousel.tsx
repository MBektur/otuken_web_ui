"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { WPPost, postCategory, postImage, displayDate } from "@/lib/wordpress";
import { localPath, plainText } from "@/lib/content";

export function RelatedCarousel({ posts }: { posts: WPPost[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(posts.length > 1);
  const [activeIndex, setActiveIndex] = useState(0);

  function checkScroll() {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // In RTL, scrollLeft is typically <= 0 or between 0 and (scrollWidth - clientWidth)
    const maxScroll = scrollWidth - clientWidth;
    const absScroll = Math.abs(scrollLeft);
    setCanPrev(absScroll > 10);
    setCanNext(absScroll < maxScroll - 10);

    // Calculate approximate active card
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 20 : 300;
    const idx = Math.min(posts.length - 1, Math.max(0, Math.round(absScroll / cardWidth)));
    setActiveIndex(idx);
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

  function scroll(direction: "prev" | "next") {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 22 : 320;
    // In RTL, "next" scrolls in the negative direction, "prev" in the positive direction
    const delta = direction === "next" ? -step : step;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  if (!posts || posts.length === 0) return null;

  return (
    <section className="related-carousel-section" aria-label="مۇناسىۋەتلىك يازمىلار كۆرگەزمىسى">
      <div className="related-carousel-header">
        <div className="section-heading">
          <h2>مۇناسىۋەتلىك يازمىلار</h2>
          <span className="related-count">
            <b dir="ltr">{posts.length}</b> تەۋسىيە
          </span>
        </div>

        <div className="carousel-controls" aria-label="كۆرگەزمە كونتروللىرى">
          <button
            type="button"
            className="carousel-arrow"
            onClick={() => scroll("prev")}
            disabled={!canPrev}
            aria-label="ئالدىنقى يازمىلار"
            title="ئالدىنقى"
          >
            <ChevronRight size={20} />
          </button>
          <span className="carousel-page-indicator" dir="ltr">
            {activeIndex + 1} / {posts.length}
          </span>
          <button
            type="button"
            className="carousel-arrow"
            onClick={() => scroll("next")}
            disabled={!canNext}
            aria-label="كېيىنكى يازمىلار"
            title="كېيىنكى"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      <div className="carousel-viewport">
        <div className="carousel-track" ref={trackRef}>
          {posts.map((post, idx) => {
            const img = postImage(post);
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
                >
                  {img ? (
                    <img src={img} alt="" loading="lazy" />
                  ) : (
                    <div className="carousel-no-photo">ئورخۇن</div>
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
                    <Link href={localPath(post.link)}>
                      {plainText(post.title.rendered)}
                    </Link>
                  </h3>
                  <p className="carousel-excerpt">
                    {plainText(post.excerpt.rendered)}
                  </p>
                  <Link href={localPath(post.link)} className="read-link">
                    ئوقۇڭ <ArrowLeft size={14} />
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
