import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, BookOpen, Globe2, Landmark, ChevronLeft } from "lucide-react";
import { Category, WPPost, displayDate, postCategory, postImage, readingMinutes } from "@/lib/wordpress";
import { localPath, plainText } from "@/lib/content";

export function PostPhoto({ post, priority = false }: { post: WPPost; priority?: boolean }) {
  const src = postImage(post);
  return <Link href={localPath(post.link)} className={`post-photo ${!src ? "photo-empty" : ""}`} tabIndex={-1} aria-hidden="true">
    {src ? <img src={src} alt="" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async"/> : <Globe2 size={44} strokeWidth={1}/>}
  </Link>;
}

export function PostMeta({ post }: { post: WPPost }) {
  return <div className="post-meta"><span>{postCategory(post)}</span><i/><time dateTime={post.date} dir="ltr">{displayDate(post.date)}</time></div>;
}

export function ReadLink({ href, children = "داۋامىنى ئوقۇڭ" }: { href: string; children?: React.ReactNode }) {
  return <Link className="read-link" href={href}>{children}<ArrowLeft size={15}/></Link>;
}

export function SectionTitle({ children, href, label = "ھەممىنى كۆرۈڭ" }: { children: React.ReactNode; href?: string; label?: string }) {
  return <div className="section-heading"><h2>{children}</h2>{href && <Link href={href}>{label}<ArrowLeft size={15}/></Link>}</div>;
}

export function PostCard({ post }: { post: WPPost }) {
  return <article className="post-card"><PostPhoto post={post}/><PostMeta post={post}/><h3><Link href={localPath(post.link)}>{plainText(post.title.rendered)}</Link></h3><p className="card-excerpt">{plainText(post.excerpt.rendered)}</p><ReadLink href={localPath(post.link)}/></article>;
}

export function RegionRail({ categories, total }: { categories: Category[]; total?: number }) {
  const regions = categories.filter(c => c.parent === 4 && c.count > 0).sort((a,b) => b.count-a.count);
  return <aside className="region-rail" id="regions"><SectionTitle>رايونلار</SectionTitle><div className="region-list">{regions.map((c, i) => <Link href={localPath(c.link)} key={c.id}><span className="region-icon">{i < 2 ? <Landmark size={21} strokeWidth={1.2}/> : <Globe2 size={21} strokeWidth={1.2}/>}</span><span>{c.name}<small><b dir="ltr">{c.count}</b> يازما</small></span><ChevronLeft size={13}/></Link>)}</div><div className="rail-quote"><span className="quote-mark">“</span><p>دۇنيانى چۈشىنىش،<br/>كەلگۈسىنى ئويلاشتىن<br/>باشلىنىدۇ.</p><span className="quote-rule"/></div><div className="archive-note"><BookOpen size={23} strokeWidth={1.2}/><strong>تەتقىقات ئارخىپى</strong><p>سىياسەت، تارىخ ۋە خەلقئارا مۇناسىۋەتلەر ھەققىدىكى يازمىلار.</p>{total !== undefined && <span><b dir="ltr">{total}</b> يازما</span>}<ReadLink href="/uy?q=" children="ئارخىپنى كۆرۈڭ"/></div></aside>;
}

export function LatestRail({ posts, books }: { posts: WPPost[]; books: WPPost[] }) {
  return <aside className="latest-rail"><SectionTitle>يېڭى نەزەر</SectionTitle><div className="rail-label"><Globe2 size={15}/> دۇنيا ۋە سىياسەت</div>{posts.slice(0,2).map(post => <article className="side-story" key={post.id}><PostPhoto post={post}/><PostMeta post={post}/><h3><Link href={localPath(post.link)}>{plainText(post.title.rendered)}</Link></h3><ReadLink href={localPath(post.link)} children="ئوقۇڭ"/></article>)}<div className="rail-label book-label"><BookOpen size={16}/> كىتاپ تەكچىسى</div>{books.slice(0,1).map(post => <article className="side-story book-story" key={post.id}><PostPhoto post={post}/><h3><Link href={localPath(post.link)}>{plainText(post.title.rendered)}</Link></h3><ReadLink href={localPath(post.link)} children="تەپسىلاتى"/></article>)}<a className="source-link" href="https://orhunpolicycenter.com/" lang="en" dir="ltr">Orhun in English<ArrowUpLeft size={15}/></a></aside>;
}

export function Hero({ post, secondary }: { post: WPPost; secondary?: WPPost }) {
  return <section className="hero-section"><SectionTitle href="/uy?q=" label="بارلىق يازمىلار">ئورخۇن نەزىرى</SectionTitle><div className="hero-grid"><article className="hero-story"><div className="hero-copy"><PostMeta post={post}/><h1><Link href={localPath(post.link)}>{plainText(post.title.rendered)}</Link></h1><p>{plainText(post.excerpt.rendered)}</p><div className="hero-author"><span>{post._embedded?.author?.[0]?.name}</span><span>{readingMinutes(post)} مىنۇت ئوقۇش</span></div><ReadLink href={localPath(post.link)}/></div><PostPhoto post={post} priority/></article>{secondary && <article className="hero-secondary"><PostPhoto post={secondary}/><PostMeta post={secondary}/><h3><Link href={localPath(secondary.link)}>{plainText(secondary.title.rendered)}</Link></h3><p>{plainText(secondary.excerpt.rendered)}</p><ReadLink href={localPath(secondary.link)}/></article>}</div></section>;
}

export function Pagination({ page, totalPages, base, query }: { page: number; totalPages: number; base: string; query?: string }) {
  if (totalPages <= 1) return null;
  function href(n: number) { const params = new URLSearchParams(); if (query !== undefined) params.set("q",query); params.set("page",String(n)); return `${base}?${params}`; }
  return <nav className="pagination" aria-label="بەتلەر">{page > 1 && <Link href={href(page-1)}>ئالدىنقى بەت</Link>}<span><b dir="ltr">{page}</b> / <b dir="ltr">{totalPages}</b></span>{page < totalPages && <Link href={href(page+1)}>كېيىنكى بەت<ArrowLeft size={15}/></Link>}</nav>;
}
