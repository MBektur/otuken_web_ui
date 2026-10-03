import type { Metadata } from "next";
import Link from "next/link";
import { getCategoriesUg, getPostsUg, postCategory, WordPressError, localPath } from "@/lib/wordpress-ug";
import { plainText, robustDecode } from "@/lib/content";
import { Header, Footer, SearchForm } from "@/components-ug/shell";
import { Hero, LatestRail, RegionRail, PostCard, SectionTitle, Pagination, PostPhoto } from "@/components-ug/editorial";

export const revalidate = 300;

import { buildSeoMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, page } = await searchParams;
  const decoded = q ? robustDecode(q).slice(0, 200).trim() : undefined;
  const query = decoded !== undefined && decoded !== "" ? decoded : undefined;
  const browsing = q !== undefined || !!page;
  const title = query ? `Издәш: ${query}` : (page ? "Барлиқ Йазмилар" : "Башбәт — Өтүкән Сийасәт Тәтқиқат Мәркизи");
  const description = query
    ? `«${query}» Һәққидики тәтқиқат, мақалә вә сийасий анализлар.`
    : "Өтүкән Сийасәт Тәтқиқат Мәркизи — Мустәқил көз қараш, дунйаға нәзәр вә кәлгүсигә тәпәккур.";

  return buildSeoMetadata({
    title,
    description,
    path: "/ug",
    locale: "ug",
    type: "website",
    noIndex: browsing,
  });
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const rawQ = params.q;
  const decoded = rawQ ? robustDecode(rawQ).slice(0, 200).trim() : undefined;
  const query = decoded !== undefined && decoded !== "" ? decoded : undefined;
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page || "1", 10) || 1));
  const listing = rawQ !== undefined || page > 1;
  const [categories, result, books] = await Promise.all([
    getCategoriesUg(),
    getPostsUg({ page, perPage: 12, search: query }).catch((error: any) => { if (error instanceof WordPressError && error.status === 400 && page > 1) return { data: [], total: 0, totalPages: 0 }; throw error; }),
    getPostsUg({ category: 14, perPage: 1 }),
  ]);
  const posts = result.data;
  return <><Header categories={categories} /><main id="main" className="site-width editorial-layout">
    <RegionRail categories={categories} total={result.total} />
    <div className="main-column">
      {listing ? <><div className="listing-header"><span className="eyebrow">Өтүкән Архипи</span><h1>{query ? `«${query}» Ниң Издәш Нәтиҗиси` : "Барлиқ Йазмилар"}</h1><p><b dir="ltr">{result.total}</b> Йазма</p><SearchForm value={query} /></div><div className="posts-grid">{posts.map((post: any) => <PostCard key={post.id} post={post} />)}</div>{!posts.length && <div className="empty-state"><h2>Йазма Тепилмиди</h2><p>Башқа Ачқучлуқ Сөз Билән Издәп Беқиң.</p><Link href="/ug">Башбәткә Қайтиш →</Link></div>}</> : <>
        {posts[0] && <Hero post={posts[0]} secondary={posts[1]} />}
        <section className="readings-section"><SectionTitle href="/ug?q=">Йеқинқи Йазмилар</SectionTitle><div className="posts-grid">{posts.slice(2, 5).map((post: any) => <PostCard key={post.id} post={post} />)}</div></section>
        <section className="briefings-section"><SectionTitle href="/ug?q=">Давамлиқ Оқуң</SectionTitle><div className="briefings-grid">{posts.slice(5, 8).map((post: any) => <article className="briefing" key={post.id}><PostPhoto post={post} /><div className="briefing-content"><span className="eyebrow">{postCategory(post)}</span><h3><Link href={localPath(post.link)}>{plainText(post.title.rendered)}</Link></h3><Link href={localPath(post.link)} className="briefing-link">Оқуң →</Link></div></article>)}</div></section>
      </>}
      <Pagination page={page} totalPages={result.totalPages} base="/ug" query={query} />
    </div><LatestRail posts={posts.slice(8, 10)} books={books.data} />
  </main><Footer /></>;
}
