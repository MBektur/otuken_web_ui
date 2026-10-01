import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock3, Maximize2 } from "lucide-react";
import { getCategories, getPages, getPostBySlug, getPosts, postImage, readingMinutes, displayDate, postCategory, WordPressError, WPPost } from "@/lib/wordpress";
import { localPath, normalizedPath, plainText, safeContent } from "@/lib/content";
import { Header, Footer } from "@/components/shell";
import { PostCard, RegionRail, PostMeta, Pagination, SectionTitle } from "@/components/editorial";
import { ScrollControls } from "@/components/scroll-controls";
import { RelatedCarousel } from "@/components/related-carousel";
import { ArticleSidebar } from "@/components/article-sidebar";

export const revalidate = 300;

type Props = { params: Promise<{ path: string[] }>; searchParams: Promise<{ page?: string }> };

const resolve = cache(async (pathKey: string) => {
  const path = pathKey ? pathKey.split("/") : [];
  const pathname = normalizedPath(`/uy/${path.join("/")}`);
  const categories = await getCategories();
  const category = categories.find(c => normalizedPath(localPath(c.link)) === pathname);
  if (category) return { kind: "category" as const, categories, category };
  if (path[0] === "category") return undefined;
  if (path.length === 1) {
    const pages = await getPages();
    const page = pages.find(p => normalizedPath(localPath(p.link)) === pathname);
    if (page) return { kind: "page" as const, categories, page };
  }
  const post = await getPostBySlug(path[path.length - 1]);
  if (post) return { kind: "post" as const, categories, post };
});

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { path } = await params;
  const data = await resolve(path.join("/"));
  if (!data) return { title: "بەت تېپىلمىدى" };
  if (data.kind === "category") {
    const { page } = await searchParams;
    return { title: data.category.name, alternates: { canonical: localPath(data.category.link) + (page && Number(page) > 1 ? `?page=${Number(page)}` : "") } };
  }
  const item = data.kind === "post" ? data.post : data.page;
  const title = plainText(item.title.rendered);
  return { title, description: plainText(data.kind === "post" ? data.post.excerpt.rendered : item.content.rendered).slice(0, 170), alternates: { canonical: localPath(item.link) }, openGraph: { title, type: data.kind === "post" ? "article" : "website", images: data.kind === "post" && postImage(data.post) ? [postImage(data.post)!] : undefined } };
}

export default async function ContentPage({ params, searchParams }: Props) {
  const { path } = await params;
  const data = await resolve(path.join("/"));
  if (!data) notFound();
  if (data.kind === "category") {
    const query = await searchParams;
    const page = Math.max(1, Math.min(1000, Number.parseInt(query.page || "1", 10) || 1));
    const result = await getPosts({ category: data.category.id, page }).catch(error => { if (error instanceof WordPressError && error.status === 400 && page > 1) return { data: [], total: 0, totalPages: 0 }; throw error; });
    return <><Header categories={data.categories} active={data.category.id} /><main className="site-width category-layout" id="main"><RegionRail categories={data.categories} /><div className="category-main"><div className="listing-header"><Link className="eyebrow" href="/uy">باشبەت / رايون ۋە تېمىلار</Link><h1>{data.category.name}</h1><p><b dir="ltr">{result.total}</b> يازما</p></div><div className="posts-grid">{result.data.map(post => <PostCard post={post} key={post.id} />)}</div>{!result.data.length && <div className="empty-state"><h2>ھازىرچە يازما يوق</h2><Link href="/uy">باشبەتكە قايتىش ←</Link></div>}<Pagination page={page} totalPages={result.totalPages} base={localPath(data.category.link)} /></div></main><Footer /></>;
  }
  const item = data.kind === "post" ? data.post : data.page;
  if (normalizedPath(`/uy/${path.join("/")}`) !== normalizedPath(localPath(item.link))) redirect(localPath(item.link));

  const isPost = data.kind === "post";
  let related: WPPost[] = [];
  let recentPosts: WPPost[] = [];
  let leadImage: string | undefined = undefined;
  let leadImageAlt = "";
  let leadImageCaption: string | undefined = undefined;
  let showLeadImage = false;

  if (isPost) {
    const [relResult, recentResult] = await Promise.all([
      getPosts({ category: data.post.categories[0], exclude: [item.id], perPage: 8 }).catch(() => ({ data: [] })),
      getPosts({ exclude: [item.id], perPage: 8 }).catch(() => ({ data: [] })),
    ]);
    related = relResult.data;
    if (related.length < 4) {
      const extra = recentResult.data.filter(p => !related.some(r => r.id === p.id));
      related = [...related, ...extra].slice(0, 8);
    }
    recentPosts = recentResult.data;

    const media = data.post._embedded?.["wp:featuredmedia"]?.[0];
    const postImg = postImage(data.post);
    const isYoutube = data.post.youtubeId || (postImg && (postImg.includes("youtube.com") || postImg.includes("ytimg.com")));

    if (postImg && !isYoutube) {
      leadImage = postImg;
      leadImageAlt = media?.alt_text || plainText(data.post.title.rendered);
      leadImageCaption = media?.caption?.rendered ? plainText(media.caption.rendered) : undefined;

      const filename = leadImage.split("/").pop()?.split("?")[0];
      const inContent = filename ? item.content.rendered.includes(filename) : false;
      if (!inContent) {
        showLeadImage = true;
      }
    }
  }

  return (
    <>
      <Header categories={data.categories} />
      <main id="main" className="site-width article-layout">
        <div className="article-breadcrumb">
          <Link href="/uy">باشبەت</Link>
          <span>/</span>
          {isPost ? (
            <Link href="/uy#regions">{postCategory(data.post)}</Link>
          ) : (
            <span>ئۆتۈكەن</span>
          )}
          <span>/</span>
          <span className="breadcrumb-current">{plainText(item.title.rendered)}</span>
        </div>

        <div className={isPost ? "article-grid" : "article-single-grid"}>
          <div className="article-main-col">
            <article className="article">
              <header className="article-header">
                {isPost && <PostMeta post={data.post} />}
                <h1>{plainText(item.title.rendered)}</h1>
                {isPost && (
                  <div className="article-byline">
                    <span>{data.post._embedded?.author?.[0]?.name || "ئۆتۈكەن تەھرىرىيىتى"}</span>
                    <time dateTime={data.post.date} dir="ltr">
                      {displayDate(data.post.date)}
                    </time>
                    <span>
                      <Clock3 size={14} />
                      {readingMinutes(data.post)} مىنۇت ئوقۇش
                    </span>
                  </div>
                )}
              </header>

              <div className="article-body">
                {showLeadImage && leadImage && (
                  <figure className="article-lead-dropcap">
                    <a
                      href={leadImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lead-dropcap-link"
                      title="رەسىمنى چوڭايتىپ كۆرۈش"
                    >
                      <div className="lead-dropcap-frame">
                        <img
                          src={leadImage}
                          alt={leadImageAlt}
                          className="lead-dropcap-img"
                          loading="eager"
                          decoding="async"
                        />
                        <span className="lead-dropcap-zoom-badge" aria-hidden="true">
                          <Maximize2 size={13} />
                        </span>
                      </div>
                    </a>
                    {leadImageCaption && (
                      <figcaption className="lead-dropcap-caption">{leadImageCaption}</figcaption>
                    )}
                  </figure>
                )}
                <div
                  className="article-body-inner"
                  dangerouslySetInnerHTML={{ __html: safeContent(item.content.rendered) }}
                />
              </div>

              <div className="article-end">
                <span>ئۆتۈكەن سىياسەت تەتقىقات مەركىزى</span>
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  ئەسلى نەشرى <ArrowLeft size={15} />
                </a>
              </div>
            </article>
          </div>

          {isPost && (
            <ArticleSidebar
              currentPost={data.post}
              recentPosts={recentPosts}
              categories={data.categories}
            />
          )}
        </div>

        {isPost && related.length > 0 && <RelatedCarousel posts={related} />}

        <ScrollControls />
      </main>
      <Footer />
    </>
  );
}
