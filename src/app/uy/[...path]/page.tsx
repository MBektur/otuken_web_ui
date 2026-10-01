import { cache, Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock3, Maximize2 } from "lucide-react";
import { Category, getCategories, getPages, getPostBySlug, getPosts, postImage, readingMinutes, displayDate, postCategory, WordPressError, WPPost } from "@/lib/wordpress";
import { localPath, normalizedPath, plainText, robustDecode, safeContent } from "@/lib/content";
import { safeDecode, getLocalSnapshot } from "@/lib/cache-store";
import { Header, Footer } from "@/components/shell";
import { PostCard, RegionRail, PostMeta, Pagination, SectionTitle } from "@/components/editorial";
import { ScrollControls } from "@/components/scroll-controls";
import { RelatedCarousel } from "@/components/related-carousel";
import { ArticleSidebar } from "@/components/article-sidebar";
import { ShareBar } from "@/components/share-bar";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const [categories, posts, pages] = await Promise.all([
      getCategories().catch(() => []),
      getPosts({ perPage: 100 }).catch(() => ({ data: [] })),
      getPages().catch(() => []),
    ]);

    const paramsList: { path: string[] }[] = [];

    for (const c of categories) {
      const p = localPath(c.link).replace(/^\/uy\/?/, "").split("/").filter(Boolean);
      if (p.length) paramsList.push({ path: p });
    }

    for (const page of pages) {
      const p = localPath(page.link).replace(/^\/uy\/?/, "").split("/").filter(Boolean);
      if (p.length) paramsList.push({ path: p });
    }

    for (const post of posts.data) {
      const p = localPath(post.link).replace(/^\/uy\/?/, "").split("/").filter(Boolean);
      if (p.length) paramsList.push({ path: p });
    }

    return paramsList;
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ path: string[] }>; searchParams: Promise<{ page?: string }> };

const resolve = cache(async (pathKey: string) => {
  const path = pathKey ? pathKey.split("/").filter(Boolean) : [];
  if (!path.length) return undefined;
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
  const lastSegment = path[path.length - 1];
  let post = await getPostBySlug(lastSegment);

  // Fallback: If not found and path has date segments e.g. [2025, 06, 18, slug]
  if (!post && path.length >= 4) {
    const datePrefix = `${path[0]}-${path[1]}-${path[2]}`;
    const allPosts = getLocalSnapshot().posts;
    const targetDecoded = safeDecode(lastSegment).toLowerCase();
    post = allPosts.find(p => {
      if (!p.date?.startsWith(datePrefix)) return false;
      const s = safeDecode(p.slug).toLowerCase();
      return s.includes(targetDecoded) || targetDecoded.includes(s);
    });
  }

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

async function ArticleSidebarStream({
  currentPost,
  categories,
}: {
  currentPost: WPPost;
  categories: Category[];
}) {
  const recentResult = await getPosts({ perPage: 12, page: 1 }).catch(() => ({ data: [] }));
  const recentPosts = recentResult.data.filter(p => p.id !== currentPost.id).slice(0, 4);
  return (
    <ArticleSidebar
      currentPost={currentPost}
      recentPosts={recentPosts}
      categories={categories}
    />
  );
}

async function RelatedCarouselStream({ currentPost }: { currentPost: WPPost }) {
  const catId = currentPost.categories?.[0];
  const [relResult, recentResult] = await Promise.all([
    catId ? getPosts({ category: catId, perPage: 10, page: 1 }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    getPosts({ perPage: 10, page: 1 }).catch(() => ({ data: [] })),
  ]);
  let related = relResult.data.filter(p => p.id !== currentPost.id);
  if (related.length < 4) {
    const extra = recentResult.data.filter(p => p.id !== currentPost.id && !related.some(r => r.id === p.id));
    related = [...related, ...extra].slice(0, 8);
  } else {
    related = related.slice(0, 8);
  }
  if (!related.length) return null;
  return <RelatedCarousel posts={related} />;
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
  const currentPath = normalizedPath(`/uy/${path.join("/")}`);
  const targetPath = normalizedPath(localPath(item.link));

  if (currentPath !== targetPath) {
    const isSamePost = data.kind === "post" && (
      currentPath.includes(robustDecode(data.post.slug).toLowerCase()) ||
      targetPath.includes(robustDecode(path[path.length - 1]).toLowerCase()) ||
      (data.post.date && currentPath.includes(data.post.date.slice(0, 10).replace(/-/g, "/")))
    );
    if (!isSamePost) {
      redirect(localPath(item.link));
    }
  }

  const isPost = data.kind === "post";
  let leadImage: string | undefined = undefined;
  let leadImageOriginal: string | undefined = undefined;
  let leadImageAlt = "";
  let leadImageCaption: string | undefined = undefined;
  let showLeadImage = false;

  if (isPost) {
    const media = data.post._embedded?.["wp:featuredmedia"]?.[0];
    const postImg = postImage(data.post, 1080, 80);
    const rawImg = media?.media_details?.sizes?.large?.source_url || media?.source_url || "";
    const isYoutube = data.post.youtubeId || (postImg && (postImg.includes("youtube.com") || postImg.includes("ytimg.com")));

    if (postImg && !isYoutube) {
      leadImage = postImg;
      leadImageOriginal = rawImg || undefined;
      leadImageAlt = media?.alt_text || plainText(data.post.title.rendered);
      leadImageCaption = media?.caption?.rendered ? plainText(media.caption.rendered) : undefined;

      // Use raw URL (not optimized) for content deduplication check
      const filename = rawImg.split("/").pop()?.split("?")[0];
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
                <ShareBar title={plainText(item.title.rendered)} variant="top" />
              </header>

              <div className="article-body">
                {showLeadImage && leadImage && (
                  <figure className="article-lead-dropcap">
                    <a
                      href={leadImageOriginal || leadImage}
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
                          sizes="(max-width: 768px) 100vw, 720px"
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

              <ShareBar title={plainText(item.title.rendered)} variant="bottom" />

              <div className="article-end">
                <span>ئۆتۈكەن سىياسەت تەتقىقات مەركىزى</span>
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  ئەسلى نەشرى <ArrowLeft size={15} />
                </a>
              </div>
            </article>
          </div>

          {isPost && (
            <Suspense
              fallback={
                <ArticleSidebar
                  currentPost={data.post}
                  recentPosts={[]}
                  categories={data.categories}
                />
              }
            >
              <ArticleSidebarStream
                currentPost={data.post}
                categories={data.categories}
              />
            </Suspense>
          )}
        </div>

        {isPost && (
          <Suspense fallback={null}>
            <RelatedCarouselStream currentPost={data.post} />
          </Suspense>
        )}

        <ScrollControls />
      </main>
      <Footer />
    </>
  );
}
