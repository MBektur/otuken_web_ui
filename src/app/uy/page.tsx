import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getPosts, postCategory, WordPressError } from "@/lib/wordpress";
import { localPath, plainText, robustDecode } from "@/lib/content";
import { Header, Footer, SearchForm } from "@/components/shell";
import { Hero, LatestRail, RegionRail, PostCard, SectionTitle, Pagination, PostPhoto } from "@/components/editorial";

export const revalidate = 300;

type Props = { searchParams: Promise<{ q?: string; page?: string }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, page } = await searchParams;
  const decoded = q ? robustDecode(q).slice(0, 200).trim() : undefined;
  const query = decoded !== undefined && decoded !== "" ? decoded : undefined;
  const browsing = q !== undefined || !!page;
  return {
    title: query ? `ئىزدەش: ${query}` : (page ? "بارلىق يازمىلار" : "باشبەت"),
    alternates: browsing ? undefined : { canonical: "/uy" },
    robots: browsing ? { index: false, follow: true } : undefined,
  };
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const rawQ = params.q;
  const decoded = rawQ ? robustDecode(rawQ).slice(0, 200).trim() : undefined;
  const query = decoded !== undefined && decoded !== "" ? decoded : undefined;
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page || "1", 10) || 1));
  const listing = rawQ !== undefined || page > 1;
  const [categories, result, books] = await Promise.all([
    getCategories(),
    getPosts({ page, perPage: 12, search: query }).catch(error => { if (error instanceof WordPressError && error.status === 400 && page > 1) return { data: [], total: 0, totalPages: 0 }; throw error; }),
    getPosts({ category: 14, perPage: 1 }),
  ]);
  const posts = result.data;
  return <><Header categories={categories} /><main id="main" className="site-width editorial-layout">
    <RegionRail categories={categories} total={result.total} />
    <div className="main-column">
      {listing ? <><div className="listing-header"><span className="eyebrow">ئۆتۈكەن ئارخىپى</span><h1>{query ? `«${query}» نىڭ ئىزدەش نەتىجىسى` : "بارلىق يازمىلار"}</h1><p><b dir="ltr">{result.total}</b> يازما</p><SearchForm value={query} /></div><div className="posts-grid">{posts.map(post => <PostCard key={post.id} post={post} />)}</div>{!posts.length && <div className="empty-state"><h2>يازما تېپىلمىدى</h2><p>باشقا ئاچقۇچلۇق سۆز بىلەن ئىزدەپ بېقىڭ.</p><Link href="/uy">باشبەتكە قايتىش ←</Link></div>}</> : <>
        {posts[0] && <Hero post={posts[0]} secondary={posts[1]} />}
        <section className="readings-section"><SectionTitle href="/uy?q=">يېقىنقى يازمىلار</SectionTitle><div className="posts-grid">{posts.slice(2, 5).map(post => <PostCard key={post.id} post={post} />)}</div></section>
        <section className="briefings-section"><SectionTitle href="/uy?q=">داۋاملىق ئوقۇڭ</SectionTitle><div className="briefings-grid">{posts.slice(5, 8).map(post => <article className="briefing" key={post.id}><PostPhoto post={post} /><div className="briefing-content"><span className="eyebrow">{postCategory(post)}</span><h3><Link href={localPath(post.link)}>{plainText(post.title.rendered)}</Link></h3><Link href={localPath(post.link)} className="briefing-link">ئوقۇڭ ←</Link></div></article>)}</div></section>
      </>}
      <Pagination page={page} totalPages={result.totalPages} base="/uy" query={query} />
    </div><LatestRail posts={posts.slice(8, 10)} books={books.data} />
  </main><Footer /></>;
}
