import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Globe2, Landmark, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Category, WPPost, displayDate, postCategory, postImage, readingMinutes, localPath } from "@/lib/wordpress-ug";
import { plainText } from "@/lib/content";

export function PostPhoto({ post, priority = false, size = "card" }: { post: WPPost; priority?: boolean; size?: "hero" | "card" | "thumb" }) {
  const imgWidth = size === "hero" ? 1080 : size === "thumb" ? 384 : 640;
  const imgQuality = size === "hero" ? 80 : 75;
  const src = postImage(post, imgWidth, imgQuality);
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  const width = media?.media_details?.width;
  const height = media?.media_details?.height;
  const isPortrait = width && height ? width / height < 1.15 : false;
  // Tiny blurred backdrop for portrait images
  const backdropSrc = isPortrait ? postImage(post, 128, 40) : undefined;

  return (
    <Link
      href={localPath(post.link)}
      prefetch={true}
      className={`post-photo ${!src ? "photo-empty" : ""} ${isPortrait ? "photo-portrait" : ""}`}
      tabIndex={-1}
      aria-hidden="true"
    >
      {src ? (
        <>
          {isPortrait && backdropSrc && (
            <div
              className="post-photo-backdrop"
              style={{ backgroundImage: `url(${backdropSrc})` }}
              aria-hidden="true"
            />
          )}
          <img
            src={src}
            alt=""
            className="post-photo-img"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            sizes={size === "hero" ? "(max-width: 768px) 100vw, 720px" : size === "thumb" ? "280px" : "(max-width: 768px) 100vw, 420px"}
          />
        </>
      ) : (
        <Globe2 size={44} strokeWidth={1} />
      )}
      {post.youtubeId && (
        <span className="photo-play-badge">
          <Play size={15} fill="currentColor" />
        </span>
      )}
    </Link>
  );
}

export function PostMeta({ post }: { post: WPPost }) {
  return <div className="post-meta">
    <span>{postCategory(post)}</span>
    {post.youtubeId && <span className="podcast-pill"><Play size={10} fill="currentColor" /> Син</span>}
    <i />
    <time dateTime={post.date} dir="ltr">{displayDate(post.date)}</time>
  </div>;
}

export function ReadLink({ href, children = "Давамини Оқуң" }: { href: string; children?: React.ReactNode }) {
  return <Link className="read-link" href={href} prefetch={true}>{children}<ArrowRight size={15} /></Link>;
}

export function SectionTitle({ children, href, label = "Һәммини Көрүң" }: { children: React.ReactNode; href?: string; label?: string }) {
  return <div className="section-heading"><h2>{children}</h2>{href && <Link href={href} prefetch={true}>{label}<ArrowRight size={15} /></Link>}</div>;
}

export function PostCard({ post }: { post: WPPost }) {
  return <article className="post-card"><PostPhoto post={post} /><PostMeta post={post} /><h3><Link href={localPath(post.link)} prefetch={true}>{plainText(post.title.rendered)}</Link></h3><p className="card-excerpt">{plainText(post.excerpt.rendered)}</p><ReadLink href={localPath(post.link)} /></article>;
}

export function RegionRail({ categories, total }: { categories: Category[]; total?: number }) {
  const regions = categories.filter(c => c.parent === 4 && c.count > 0).sort((a, b) => b.count - a.count);
  return <aside className="region-rail" id="regions"><SectionTitle>Районлар</SectionTitle><div className="region-list">{regions.map((c, i) => <Link href={localPath(c.link)} prefetch={true} key={c.id}><span className="region-icon">{i < 2 ? <Landmark size={21} strokeWidth={1.2} /> : <Globe2 size={21} strokeWidth={1.2} />}</span><span>{c.name}<small><b dir="ltr">{c.count}</b> Йазма</small></span><ChevronRight size={13} /></Link>)}</div><div className="rail-quote"><span className="quote-mark">“</span><p>Дунйани Чүшиниш,<br />Кәлгүсини Ойлаштин<br />Башлиниду.</p><span className="quote-rule" /></div><div className="archive-note"><BookOpen size={23} strokeWidth={1.2} /><strong>Тәтқиқат Архипи</strong><p>Сийасәт, Тарих Вә Хәлқара Мунасивәтләр Һәққидики Йазмилар.</p>{total !== undefined && <span><b dir="ltr">{total}</b> Йазма</span>}<ReadLink href="/ug?q=" children="Архипни Көрүң" /></div></aside>;
}

export function LatestRail({ posts, books }: { posts: WPPost[]; books: WPPost[] }) {
  return <aside className="latest-rail"><SectionTitle>Йеңи Нәзәр</SectionTitle><div className="rail-label"><Globe2 size={15} /> Дунйа Вә Сийасәт</div>{posts.slice(0, 2).map(post => <article className="side-story" key={post.id}><PostPhoto post={post} size="thumb" /><PostMeta post={post} /><h3><Link href={localPath(post.link)} prefetch={true}>{plainText(post.title.rendered)}</Link></h3><ReadLink href={localPath(post.link)} children="Оқуң" /></article>)}<div className="rail-label book-label"><BookOpen size={16} /> Китап Тәкчиси</div>{books.slice(0, 1).map(post => <article className="side-story book-story" key={post.id}><PostPhoto post={post} size="thumb" /><h3><Link href={localPath(post.link)} prefetch={true}>{plainText(post.title.rendered)}</Link></h3><ReadLink href={localPath(post.link)} children="Тәпсилати" /></article>)}<a className="source-link" href="https://orhunpolicycenter.com/" lang="en" dir="ltr">Orhun in English<ArrowUpRight size={15} /></a></aside>;
}

export function Hero({ post, secondary }: { post: WPPost; secondary?: WPPost }) {
  return <section className="hero-section"><SectionTitle href="/ug?q=" label="Барлиқ Йазмилар">Өтүкән Нәзири</SectionTitle><div className="hero-grid"><article className="hero-story"><div className="hero-copy"><PostMeta post={post} /><h1><Link href={localPath(post.link)} prefetch={true}>{plainText(post.title.rendered)}</Link></h1><p>{plainText(post.excerpt.rendered)}</p><div className="hero-author"><span>{post._embedded?.author?.[0]?.name}</span><span>{readingMinutes(post)} Минут Оқуш</span></div><ReadLink href={localPath(post.link)} /></div><PostPhoto post={post} priority size="hero" /></article>{secondary && <article className="hero-secondary"><PostPhoto post={secondary} /><PostMeta post={secondary} /><h3><Link href={localPath(secondary.link)} prefetch={true}>{plainText(secondary.title.rendered)}</Link></h3><p>{plainText(secondary.excerpt.rendered)}</p><ReadLink href={localPath(secondary.link)} /></article>}</div></section>;
}

export function Pagination({
  page,
  totalPages,
  base,
  query,
}: {
  page: number;
  totalPages: number;
  base: string;
  query?: string;
}) {
  if (totalPages <= 1) return null;

  function href(n: number) {
    const params = new URLSearchParams();
    if (query !== undefined) params.set("q", query);
    params.set("page", String(n));
    return `${base}?${params}`;
  }

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (page >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  const pages = getPageNumbers();

  return (
    <nav className="pagination" aria-label="Бәтләр">
      {/* Previous button (in LTR, points left towards lower numbers) */}
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          prefetch={true}
          className="page-nav-btn"
          aria-label="Алдинқи Бәт"
          title="Алдинқи Бәт"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </Link>
      ) : (
        <span className="page-nav-btn disabled" aria-hidden="true" title="Алдинқи Бәт Йоқ">
          <ChevronLeft size={18} />
        </span>
      )}

      {/* Numbered page circular buttons */}
      <div className="page-numbers">
        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="page-ellipsis" aria-hidden="true">
                •••
              </span>
            );
          }
          const num = Number(p);
          const isCurrent = num === page;
          return isCurrent ? (
            <span
              key={num}
              className="page-btn active"
              aria-current="page"
              aria-label={`${num}-Бәт`}
            >
              <b dir="ltr">{num}</b>
            </span>
          ) : (
            <Link
              key={num}
              href={href(num)}
              prefetch={true}
              className="page-btn"
              aria-label={`${num}-Бәт`}
            >
              <b dir="ltr">{num}</b>
            </Link>
          );
        })}
      </div>

      {/* Mobile compact badge */}
      <div className="page-badge-mobile">
        <span className="page-counter-pill">
          <b dir="ltr">{page}</b> / <b dir="ltr">{totalPages}</b>
        </span>
      </div>

      {/* Next button (in LTR, points right towards higher numbers) */}
      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          prefetch={true}
          className="page-nav-btn"
          aria-label="Кейинки Бәт"
          title="Кейинки Бәт"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      ) : (
        <span className="page-nav-btn disabled" aria-hidden="true" title="Кейинки Бәт Йоқ">
          <ChevronRight size={18} />
        </span>
      )}
    </nav>
  );
}
