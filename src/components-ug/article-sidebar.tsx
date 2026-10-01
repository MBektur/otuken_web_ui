"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock3, Share2, Check, BookOpen, Compass } from "lucide-react";
import { Category, WPPost, displayDate, postCategory, postImage, readingMinutes, localPath } from "@/lib/wordpress-ug";
import { plainText } from "@/lib/content";

export function ArticleSidebar({
  currentPost,
  recentPosts,
  categories,
}: {
  currentPost: WPPost;
  recentPosts: WPPost[];
  categories: Category[];
}) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  }

  // Pick top region categories
  const activeCategories = categories
    .filter(c => c.count > 0 && c.id !== 1)
    .slice(0, 8);

  return (
    <aside className="article-sidebar" aria-label="Йан Балдақ Мәзмунлири">
      {/* Sticky container */}
      <div className="article-sidebar-sticky">
        {/* Quick Article Meta & Share */}
        <div className="sidebar-card sidebar-meta-card">
          <div className="sidebar-meta-item">
            <span className="sidebar-meta-label">Тема Бойичә:</span>
            <span className="sidebar-meta-badge">{postCategory(currentPost)}</span>
          </div>

          <div className="sidebar-meta-row">
            <span>
              <Clock3 size={14} /> Тәхминән {readingMinutes(currentPost)} Минут Оқуш
            </span>
            <time dateTime={currentPost.date} dir="ltr">
              {displayDate(currentPost.date)}
            </time>
          </div>

          <button
            type="button"
            className={`sidebar-share-btn ${copied ? "is-copied" : ""}`}
            onClick={handleShare}
            aria-label="Мақалә Уланмисини Көчүрүш"
          >
            {copied ? (
              <>
                <Check size={16} strokeWidth={2.5} /> Уланма Көчүрүлди!
              </>
            ) : (
              <>
                <Share2 size={16} /> Мақалини Һәмбәһирләш
              </>
            )}
          </button>
        </div>

        {/* Recommended / Latest Analyses */}
        {recentPosts.length > 0 && (
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <Compass size={17} strokeWidth={1.8} />
              <h3>Тәвсийә Йазмилар</h3>
            </div>
            <div className="sidebar-post-list">
              {recentPosts.slice(0, 4).map(post => {
                const img = postImage(post, 256, 70);
                return (
                  <article key={post.id} className="sidebar-post-item">
                    {img && (
                      <Link
                        href={localPath(post.link)}
                        className="sidebar-post-thumb"
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <img src={img} alt="" loading="lazy" decoding="async" sizes="120px" />
                      </Link>
                    )}
                    <div className="sidebar-post-info">
                      <span className="eyebrow">{postCategory(post)}</span>
                      <h4>
                        <Link href={localPath(post.link)}>
                          {plainText(post.title.rendered)}
                        </Link>
                      </h4>
                      <time dateTime={post.date} dir="ltr">
                        {displayDate(post.date)}
                      </time>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories / Topics */}
        {activeCategories.length > 0 && (
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <BookOpen size={17} strokeWidth={1.8} />
              <h3>Мунасивәтлик Темилар</h3>
            </div>
            <div className="sidebar-tags-grid">
              {activeCategories.map(cat => (
                <Link
                  key={cat.id}
                  href={localPath(cat.link)}
                  className="sidebar-tag-chip"
                >
                  <span>{cat.name}</span>
                  <small dir="ltr">({cat.count})</small>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* About Motto */}
        <div className="sidebar-card sidebar-about-card">
          <span className="sidebar-about-title">Өтүкән Тәтқиқат Мәркизи</span>
          <p>«Дунйаға Нәзәр, Кәлгүсигә Тәпәккур.» Сийасий Анализ Вә Мустәқил Көз Қараш.</p>
          <Link href="/ug/Һәққимиздә/" className="read-link">
            Тәпсилати ←
          </Link>
        </div>
      </div>
    </aside>
  );
}
