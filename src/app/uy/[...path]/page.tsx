import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { getCategories, getPages, getPostBySlug, getPosts, postImage, readingMinutes, displayDate, WordPressError } from "@/lib/wordpress";
import { localPath, normalizedPath, plainText, safeContent } from "@/lib/content";
import { Header, Footer } from "@/components/shell";
import { PostCard, RegionRail, PostMeta, Pagination, SectionTitle } from "@/components/editorial";

type Props = { params: Promise<{ path: string[] }>; searchParams: Promise<{ page?: string }> };
async function resolve(path: string[]) {
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
  const post = await getPostBySlug(path[path.length-1]);
  if (post) return { kind: "post" as const, categories, post };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { path } = await params;
  const data = await resolve(path);
  if (!data) return { title: "بەت تېپىلمىدى" };
  if (data.kind === "category") {
    const { page } = await searchParams;
    return { title: data.category.name, alternates: { canonical: localPath(data.category.link) + (page && Number(page) > 1 ? `?page=${Number(page)}` : "") } };
  }
  const item = data.kind === "post" ? data.post : data.page;
  const title = plainText(item.title.rendered);
  return { title, description: plainText(data.kind === "post" ? data.post.excerpt.rendered : item.content.rendered).slice(0,170), alternates: { canonical: localPath(item.link) }, openGraph: { title, type: data.kind === "post" ? "article" : "website", images: data.kind === "post" && postImage(data.post) ? [postImage(data.post)!] : undefined } };
}

export default async function ContentPage({ params, searchParams }: Props) {
  const { path } = await params;
  const data = await resolve(path);
  if (!data) notFound();
  if (data.kind === "category") {
    const query = await searchParams;
    const page = Math.max(1,Math.min(1000,Number.parseInt(query.page || "1",10) || 1));
    const result = await getPosts({ category: data.category.id, page }).catch(error => { if (error instanceof WordPressError && error.status === 400 && page > 1) return { data: [], total: 0, totalPages: 0 }; throw error; });
    return <><Header categories={data.categories} active={data.category.id}/><main className="site-width category-layout" id="main"><RegionRail categories={data.categories}/><div className="category-main"><div className="listing-header"><Link className="eyebrow" href="/uy">باشبەت / رايون ۋە تېمىلار</Link><h1>{data.category.name}</h1><p><b dir="ltr">{result.total}</b> يازما</p></div><div className="posts-grid">{result.data.map(post => <PostCard post={post} key={post.id}/>)}</div>{!result.data.length && <div className="empty-state"><h2>ھازىرچە يازما يوق</h2><Link href="/uy">باشبەتكە قايتىش ←</Link></div>}<Pagination page={page} totalPages={result.totalPages} base={localPath(data.category.link)}/></div></main><Footer/></>;
  }
  const item = data.kind === "post" ? data.post : data.page;
  if (normalizedPath(`/uy/${path.join("/")}`) !== normalizedPath(localPath(item.link))) redirect(localPath(item.link));
  const related = data.kind === "post" ? (await getPosts({ category: data.post.categories[0], exclude: [item.id], perPage: 3 })).data : [];
  return <><Header categories={data.categories}/><main id="main" className="site-width article-layout"><div className="article-breadcrumb"><Link href="/uy">باشبەت</Link><span>/</span><span>{data.kind === "post" ? "يازما" : "ئورخۇن"}</span></div><article className="article"><header className="article-header">{data.kind === "post" && <PostMeta post={data.post}/>}<h1>{plainText(item.title.rendered)}</h1>{data.kind === "post" && <div className="article-byline"><span>{data.post._embedded?.author?.[0]?.name}</span><time dateTime={data.post.date} dir="ltr">{displayDate(data.post.date)}</time><span><Clock3 size={14}/>{readingMinutes(data.post)} مىنۇت ئوقۇش</span></div>}</header><div className="article-body" dangerouslySetInnerHTML={{ __html: safeContent(item.content.rendered) }}/><div className="article-end"><span>ئورخۇن سىياسەت تەتقىقات مەركىزى</span><a href={item.link}>ئەسلى نەشرى <ArrowLeft size={15}/></a></div></article>{related.length > 0 && <section className="related-section"><SectionTitle>مۇناسىۋەتلىك يازمىلار</SectionTitle><div className="posts-grid">{related.map(post => <PostCard key={post.id} post={post}/>)}</div></section>}</main><Footer/></>;
}
