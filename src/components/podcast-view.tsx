"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Play, Youtube, ArrowLeft, Clock3, Volume2 } from "lucide-react";
import { WPPost, postCategory, displayDate, readingMinutes, toCachedImageUrl } from "@/lib/wordpress";
import { localPath, plainText } from "@/lib/content";

export function PodcastView({ podcasts }: { podcasts: WPPost[] }) {
  const [selectedPost, setSelectedPost] = useState<WPPost | null>(podcasts[0] || null);
  const playerRef = useRef<HTMLDivElement>(null);

  function handleSelectVideo(post: WPPost) {
    setSelectedPost(post);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (!podcasts || podcasts.length === 0) {
    return (
      <div className="empty-state">
        <h2>ھازىرچە پودكاست يوق</h2>
        <p>يېڭى پودكاست ۋە سىن مەزمۇنلىرى پات يېقىندا قوشۇلىدۇ.</p>
        <Link href="/uy">باشبەتكە قايتىش ←</Link>
      </div>
    );
  }

  const current = selectedPost || podcasts[0];
  const ytId = current.youtubeId;

  return (
    <div className="podcasts-container">
      {/* Featured / Active Video Player */}
      <section className="podcast-hero" ref={playerRef}>
        <div className="podcast-player-wrapper">
          {ytId ? (
            <div className="podcast-video-frame">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0`}
                title={plainText(current.title.rendered)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <div className="podcast-player-placeholder">
              <Volume2 size={48} />
              <span>سىن تېپىلمىدى</span>
            </div>
          )}
        </div>

        <div className="podcast-hero-details">
          <div className="podcast-hero-meta">
            <span className="podcast-badge-hero">
              <Volume2 size={13} /> پودكاست / سىن
            </span>
            <span className="podcast-category-pill">{postCategory(current)}</span>
            <time dateTime={current.date} dir="ltr">
              {displayDate(current.date)}
            </time>
          </div>

          <h2 className="podcast-hero-title">
            <Link href={localPath(current.link)}>
              {plainText(current.title.rendered)}
            </Link>
          </h2>

          <p className="podcast-hero-excerpt">
            {plainText(current.excerpt.rendered)}
          </p>

          <div className="podcast-hero-actions">
            <Link href={localPath(current.link)} className="podcast-read-btn">
              ماقالىنى ئوقۇش <ArrowLeft size={15} />
            </Link>
            {ytId && (
              <a
                href={`https://www.youtube.com/watch?v=${ytId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="podcast-yt-btn"
                dir="ltr"
              >
                <Youtube size={17} /> YouTube دا كۆرۈش
              </a>
            )}
            <span className="podcast-duration">
              <Clock3 size={13} /> {readingMinutes(current)} مىنۇتلۇق مەزمۇن
            </span>
          </div>
        </div>
      </section>

      {/* Episodes Grid */}
      <section className="podcast-list-section">
        <div className="section-heading">
          <h2>بارلىق پودكاست ۋە سىن مەزمۇنلىرى</h2>
          <span className="related-count">
            جەمئىي <b dir="ltr">{podcasts.length}</b> سان
          </span>
        </div>

        <div className="podcast-grid">
          {podcasts.map(post => {
            const isPlaying = post.id === current.id;
            const rawThumb =
              post.previewImage ||
              (post.youtubeId
                ? `https://img.youtube.com/vi/${post.youtubeId}/hqdefault.jpg`
                : undefined);
            const thumb = toCachedImageUrl(rawThumb, 384, 75);

            return (
              <article
                key={post.id}
                className={`podcast-card ${isPlaying ? "is-playing" : ""}`}
              >
                <div
                  className="podcast-card-media"
                  onClick={() => handleSelectVideo(post)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${plainText(post.title.rendered)} پودكاستىنى قويۇش`}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleSelectVideo(post);
                    }
                  }}
                >
                  {thumb ? (
                    <img src={thumb} alt="" loading="lazy" decoding="async" sizes="320px" />
                  ) : (
                    <div className="photo-empty">ئۆتۈكەن سىن</div>
                  )}
                  <div className="podcast-play-overlay">
                    <span className="podcast-play-icon">
                      <Play size={20} fill="currentColor" />
                    </span>
                    <span className="podcast-play-label">
                      {isPlaying ? "ھازىر قويۇلۇۋاتىدۇ" : "قويۇش"}
                    </span>
                  </div>
                </div>

                <div className="podcast-card-content">
                  <div className="post-meta">
                    <span className="eyebrow">{postCategory(post)}</span>
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

                  <p className="podcast-card-excerpt">
                    {plainText(post.excerpt.rendered)}
                  </p>

                  <div className="podcast-card-footer">
                    <button
                      type="button"
                      className="podcast-watch-inline"
                      onClick={() => handleSelectVideo(post)}
                    >
                      <Play size={13} fill="currentColor" /> قويۇش
                    </button>
                    <Link href={localPath(post.link)} className="read-link">
                      تولۇق يازما <ArrowLeft size={13} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
