"use client";

import { useCardCarousel } from "@/components/use-card-carousel";
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

  const { trackRef, isRtl, isDragging, currentPage, totalPages, canPrev, canNext,
    autoplayDirectionRef, scrollOneCard, handleClickCapture, pauseHandlers, dragHandlers,
  } = useCardCarousel(sortedPosts.length, AUTOPLAY_INTERVAL);

  if (!sortedPosts || sortedPosts.length === 0) return null;

  return (
    <section
      className="recent-carousel-section"
      aria-label="يېقىنقى يازمىلار كۆرگەزمىسى"
      {...pauseHandlers}
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

          {/* Navigation follows the actual text direction. */}
          <button
            type="button"
            className="recent-carousel-arrow"
            onClick={() => {
              autoplayDirectionRef.current = "prev";
              scrollOneCard("prev");
            }}
            disabled={!canPrev}
            aria-disabled={!canPrev}
            aria-label="ئالدىنقى يازما"
            title={canPrev ? "ئالدىنقى" : "ئالدىنقى يازما يوق"}
          >
            {isRtl ? <ChevronRight size={15} strokeWidth={2.2} /> : <ChevronLeft size={15} strokeWidth={2.2} />}
          </button>
          <button
            type="button"
            className="recent-carousel-arrow"
            onClick={() => {
              autoplayDirectionRef.current = "next";
              scrollOneCard("next");
            }}
            disabled={!canNext}
            aria-disabled={!canNext}
            aria-label="كېيىنكى يازما"
            title={canNext ? "كېيىنكى" : "كېيىنكى يازما يوق"}
          >
            {isRtl ? <ChevronLeft size={15} strokeWidth={2.2} /> : <ChevronRight size={15} strokeWidth={2.2} />}
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="recent-carousel-viewport">
        <div
          ref={trackRef}
          className={`recent-carousel-track ${isDragging ? "is-dragging" : ""}`}
          {...dragHandlers}
          tabIndex={0}
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
