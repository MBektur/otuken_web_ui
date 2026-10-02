import { cache, Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Clock3, Maximize2 } from "lucide-react";
import { Category, getCategoriesUg, getPagesUg, getPostBySlugUg, getPostsUg, getSmartRelatedPostsUg, postImage, readingMinutes, displayDate, postCategory, WordPressError, WPPost, localPath } from "@/lib/wordpress-ug";
import { normalizedPath, plainText, robustDecode, safeContent } from "@/lib/content";
import { safeDecode, getLocalSnapshot } from "@/lib/cache-store";
import { Header, Footer } from "@/components-ug/shell";
import { PostCard, RegionRail, PostMeta, Pagination, SectionTitle } from "@/components-ug/editorial";
import { ScrollControls } from "@/components-ug/scroll-controls";
import { RelatedCarousel } from "@/components-ug/related-carousel";
import { ArticleSidebar } from "@/components-ug/article-sidebar";
import { ShareBar } from "@/components-ug/share-bar";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const [categories, posts, pages] = await Promise.all([
      getCategoriesUg().catch(() => []),
      getPostsUg({ perPage: 100 }).catch(() => ({ data: [] })),
      getPagesUg().catch(() => []),
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
  const pathname = normalizedPath(`/ug/${path.join("/")}`);
  const categories = await getCategoriesUg();
  const category = categories.find(c => normalizedPath(localPath(c.link)) === pathname);
  if (category) return { kind: "category" as const, categories, category };
  if (path[0] === "category") return undefined;
  if (path.length === 1) {
    const pages = await getPagesUg();
    const page = pages.find(p => normalizedPath(localPath(p.link)) === pathname);
    if (page) return { kind: "page" as const, categories, page };
  }
  const lastSegment = path[path.length - 1];
  let post = await getPostBySlugUg(lastSegment);

  // Fallback: If not found and path has date segments e.g. [2025, 06, 18, slug]
  if (!post && path.length >= 4) {
    const datePrefix = `${path[0]}-${path[1]}-${path[2]}`;
    const allPosts = getLocalSnapshot().posts;
    const targetDecoded = safeDecode(lastSegment).toLowerCase();
    const rawPost = allPosts.find(p => {
      if (!p.date?.startsWith(datePrefix)) return false;
      const s = safeDecode(p.slug).toLowerCase();
      return s.includes(targetDecoded) || targetDecoded.includes(s);
    });
    if (rawPost) {
      post = await getPostBySlugUg(rawPost.slug);
    }
  }

  // Fallback 2: Partial match for renamed or encoded slugs
  if (!post) {
    const allPosts = getLocalSnapshot().posts;
    const targetDecoded = safeDecode(lastSegment).toLowerCase();
    const rawPost = allPosts.find(p => {
      const s = safeDecode(p.slug).toLowerCase();
      return (s.length > 8 && targetDecoded.includes(s)) || (targetDecoded.length > 8 && s.includes(targetDecoded));
    });
    if (rawPost) {
      post = await getPostBySlugUg(rawPost.slug);
    }
  }

  if (post) return { kind: "post" as const, categories, post };
});

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { path } = await params;
  const data = await resolve(path.join("/"));
  if (!data) return { title: "Бәт Тепилмиди" };
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
  const recentResult = await getPostsUg({ perPage: 12, page: 1 }).catch(() => ({ data: [] }));
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
  const related = getSmartRelatedPostsUg(currentPost, 8);
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
    const result = await getPostsUg({ category: data.category.id, page }).catch((error: any) => { if (error instanceof WordPressError && error.status === 400 && page > 1) return { data: [], total: 0, totalPages: 0 }; throw error; });
    return <><Header categories={data.categories} active={data.category.id} /><main className="site-width category-layout" id="main"><RegionRail categories={data.categories} /><div className="category-main"><div className="listing-header"><Link className="eyebrow" href="/ug">Башбәт / Район Вә Темилар</Link><h1>{data.category.name}</h1><p><b dir="ltr">{result.total}</b> Йазма</p></div><div className="posts-grid">{result.data.map((post: any) => <PostCard post={post} key={post.id} />)}</div>{!result.data.length && <div className="empty-state"><h2>Һазирчә Йазма Йоқ</h2><Link href="/ug">Башбәткә Қайтиш →</Link></div>}<Pagination page={page} totalPages={result.totalPages} base={localPath(data.category.link)} /></div></main><Footer /></>;
  }
  const item = data.kind === "post" ? data.post : data.page;
  const currentPath = normalizedPath(`/ug/${path.join("/")}`);
  const targetPath = normalizedPath(localPath(item.link));

  if (currentPath !== targetPath) {
    redirect(localPath(item.link));
  }

  const isPost = data.kind === "post";
  let leadImage: string | undefined = undefined;
  let leadImageOriginal: string | undefined = undefined;
  let leadImageAlt = "";
  let leadImageCaption: string | undefined = undefined;
  let showLeadImage = false;

  if (isPost) {
    const media = data.post._embedded?.["wp:featuredmedia"]?.[0];
    const hasFeaturedMedia = Boolean(media?.source_url);
    const postImg = postImage(data.post, 1080, 80);
    const rawImg = media?.media_details?.sizes?.large?.source_url || media?.source_url || "";
    const isYoutube = data.post.youtubeId || (postImg && (postImg.includes("youtube.com") || postImg.includes("ytimg.com")));

    // Only show lead/dropcap image if the post has an actual featured thumbnail
    // AND that image (or an image) is not already at the top of the content
    if (hasFeaturedMedia && postImg && !isYoutube) {
      leadImage = postImg;
      leadImageOriginal = rawImg || undefined;
      leadImageAlt = media?.alt_text || plainText(data.post.title.rendered);
      leadImageCaption = media?.caption?.rendered ? plainText(media.caption.rendered) : undefined;

      const originalFile = (media?.source_url || "").split("/").pop()?.split("?")[0] || "";
      const lastDot = originalFile.lastIndexOf(".");
      const baseName = lastDot > 0 ? originalFile.slice(0, lastDot) : originalFile;

      const inContent = originalFile
        ? item.content.rendered.includes(originalFile) || (baseName.length > 3 && item.content.rendered.includes(baseName))
        : false;

      const firstImgMatch = item.content.rendered.match(/<img\b[^>]*>/i);
      const hasImgAtTop = firstImgMatch ? item.content.rendered.indexOf(firstImgMatch[0]) < 400 : false;

      if (!inContent && !hasImgAtTop) {
        showLeadImage = true;
      }
    }
  }

  return (
    <>
      <Header categories={data.categories} />
      <main id="main" className="site-width article-layout">
        <div className="article-breadcrumb">
          <Link href="/ug">Башбәт</Link>
          <span>/</span>
          {isPost ? (
            <Link href="/ug#regions">{postCategory(data.post)}</Link>
          ) : (
            <span>Өтүкән</span>
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
                    <span>{data.post._embedded?.author?.[0]?.name || "Өтүкән Тәһририйити"}</span>
                    <time dateTime={data.post.date} dir="ltr">
                      {displayDate(data.post.date)}
                    </time>
                    <span>
                      <Clock3 size={14} />
                      {readingMinutes(data.post)} Минут Оқуш
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
                      title="Рәсимни Чоңайтип Көрүш"
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
                <span>Өтүкән Сийасәт Тәтқиқат Мәркизи</span>
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  Әсли Нәшри <ArrowRight size={15} />
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
