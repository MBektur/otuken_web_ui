import { contentImage, plainText, extractYoutubeId, WORDPRESS_URL } from "./content";

export type Category = { id: number; name: string; slug: string; count: number; parent: number; link: string };
export type WPPage = { id: number; slug: string; link: string; title: { rendered: string }; content: { rendered: string } };
export type WPPost = WPPage & {
  date: string; modified: string; categories: number[]; excerpt: { rendered: string };
  previewImage?: string;
  readMinutes?: number;
  youtubeId?: string;
  _embedded?: {
    author?: { name: string; slug: string }[];
    "wp:featuredmedia"?: { source_url: string; alt_text: string; caption?: { rendered: string }; media_details?: { sizes?: Record<string, { source_url: string }> } }[];
    "wp:term"?: Category[][];
  };
};

export class WordPressError extends Error {
  constructor(public status: number) { super(`WordPress returned ${status}`); }
}

async function request<T>(resource: string, params: Record<string, string | number> = {}, revalidateSeconds: number = 300): Promise<{ data: T; total: number; totalPages: number }> {
  const url = new URL(`${WORDPRESS_URL}/wp-json/wp/v2/${resource}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    next: { revalidate: revalidateSeconds, tags: [resource] },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new WordPressError(response.status);
  return {
    data: await response.json() as T,
    total: Number(response.headers.get("X-WP-Total") || 0),
    totalPages: Number(response.headers.get("X-WP-TotalPages") || 1),
  };
}

type PostList = { data: WPPost[]; total: number; totalPages: number };
const postLists = new Map<string, { expires: number; result: Promise<PostList> }>();
const postBySlugMap = new Map<string, { expires: number; result: Promise<WPPost | undefined> }>();
let categoriesCache: { expires: number; result: Promise<Category[]> } | null = null;
let pagesCache: { expires: number; result: Promise<WPPage[]> } | null = null;

export function clearMemoryCache() {
  postLists.clear();
  postBySlugMap.clear();
  categoriesCache = null;
  pagesCache = null;
}

export async function getPosts(options: {
  page?: number;
  perPage?: number;
  category?: number;
  search?: string;
  exclude?: number[];
  withContent?: boolean;
} = {}): Promise<PostList> {
  const fields = options.withContent
    ? "id,date,modified,slug,link,title,content,excerpt,categories,_links,_embedded"
    : "id,date,modified,slug,link,title,excerpt,categories,_links,_embedded";
  const params: Record<string, string | number> = {
    _embed: "author,wp:term,wp:featuredmedia",
    _fields: fields,
    per_page: options.perPage || 12,
    page: options.page || 1,
    orderby: "date",
    order: "desc",
  };
  if (options.category) params.categories = options.category;
  if (options.search) params.search = options.search;
  if (options.exclude?.length) params.exclude = options.exclude.join(",");
  const key = JSON.stringify(params);
  const cached = postLists.get(key);
  if (cached && cached.expires > Date.now()) return cached.result;
  const revalidate = options.search ? 120 : 300;
  const result = request<WPPost[]>("posts", params, revalidate).then(list => ({
    ...list,
    data: list.data.map(post => {
      const ytId = post.content?.rendered ? extractYoutubeId(post.content.rendered) : undefined;
      return {
        ...post,
        previewImage: postImage(post) || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined),
        readMinutes: readingMinutes(post),
        youtubeId: ytId,
        content: { rendered: "" },
      };
    }),
  }));
  if (postLists.size >= 100) postLists.delete(postLists.keys().next().value!);
  postLists.set(key, { expires: Date.now() + (revalidate * 1000), result });
  try { return await result; }
  catch (error) { if (postLists.get(key)?.result === result) postLists.delete(key); throw error; }
}

export async function getPostBySlug(slug: string) {
  const cached = postBySlugMap.get(slug);
  if (cached && cached.expires > Date.now()) return cached.result;

  const result = request<WPPost[]>("posts", { slug, _embed: "1" }, 600).then(r => {
    const post = r.data[0];
    if (post && post.content?.rendered) {
      post.youtubeId = extractYoutubeId(post.content.rendered);
    }
    return post;
  });

  if (postBySlugMap.size >= 100) postBySlugMap.delete(postBySlugMap.keys().next().value!);
  postBySlugMap.set(slug, { expires: Date.now() + (600 * 1000), result });
  try { return await result; }
  catch (error) { if (postBySlugMap.get(slug)?.result === result) postBySlugMap.delete(slug); throw error; }
}

export async function getPodcastPosts(): Promise<WPPost[]> {
  const [page1, page2, page3] = await Promise.all([
    getPosts({ perPage: 15, page: 1, withContent: true }),
    getPosts({ perPage: 15, page: 2, withContent: true }),
    getPosts({ perPage: 15, page: 3, withContent: true }),
  ]);
  const all = [...page1.data, ...page2.data, ...page3.data];
  return all.filter(p => !!p.youtubeId);
}

export async function getCategories(): Promise<Category[]> {
  if (categoriesCache && categoriesCache.expires > Date.now()) return categoriesCache.result;
  const result = request<Category[]>("categories", { per_page: 100, hide_empty: "false" }, 3600).then(r => r.data);
  categoriesCache = { expires: Date.now() + (3600 * 1000), result };
  try { return await result; }
  catch (e) { categoriesCache = null; throw e; }
}

export async function getPages(): Promise<WPPage[]> {
  if (pagesCache && pagesCache.expires > Date.now()) return pagesCache.result;
  const result = request<WPPage[]>("pages", { per_page: 100 }, 3600).then(r => r.data);
  pagesCache = { expires: Date.now() + (3600 * 1000), result };
  try { return await result; }
  catch (e) { pagesCache = null; throw e; }
}

export function postImage(post: WPPost): string | undefined {
  if (post.previewImage) return post.previewImage;
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  return media?.media_details?.sizes?.large?.source_url || media?.source_url || contentImage(post.content.rendered);
}

export function postCategory(post: WPPost): string {
  const categories = post._embedded?.["wp:term"]?.[0] || [];
  const category = categories.find(c => c.id === 3) || categories.find(c => c.id !== 1 && c.id !== 15) || categories[0];
  return category && category.id !== 1 ? plainText(category.name) : "يازما";
}

export function readingMinutes(post: WPPost): number {
  if (post.readMinutes) return post.readMinutes;
  return Math.max(1, Math.ceil(plainText(post.content.rendered).split(/\s+/).length / 180));
}

export function displayDate(date: string): string {
  const [year, month, day] = date.slice(0, 10).split("-");
  return `${year}.${month}.${day}`;
}
