import { contentImage, plainText, extractYoutubeId, WORDPRESS_URL } from "./content";

export type Category = { id: number; name: string; slug: string; count: number; parent: number; link: string };
export type WPPage = { id: number; slug: string; link: string; title: { rendered: string }; content: { rendered: string } };
export type WPPost = WPPage & {
  date: string; modified: string; categories: number[]; tags?: number[]; excerpt: { rendered: string };
  previewImage?: string;
  readMinutes?: number;
  youtubeId?: string;
  _embedded?: {
    author?: { name: string; slug: string }[];
    "wp:featuredmedia"?: { source_url: string; alt_text: string; caption?: { rendered: string }; media_details?: { width?: number; height?: number; sizes?: Record<string, { source_url: string }> } }[];
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

import {
  getLocalCategories,
  getLocalPages,
  getLocalPostBySlug,
  getLocalPosts,
  getLocalPodcasts,
  getLocalSnapshot,
  safeDecode,
} from "./cache-store";
import { toUyghurArabic } from "./i18n";

export async function getPosts(options: {
  page?: number;
  perPage?: number;
  category?: number;
  search?: string;
  exclude?: number[];
  withContent?: boolean;
} = {}): Promise<PostList> {
  const local = getLocalPosts(options);
  if (local && (local.data.length > 0 || !options.search)) {
    return local;
  }

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
  if (options.search) {
    const rawSearch = safeDecode(options.search).trim();
    params.search = toUyghurArabic(rawSearch);
  }
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

export async function getPostBySlug(slug: string): Promise<WPPost | undefined> {
  const local = getLocalPostBySlug(slug);
  if (local) return local;

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
  catch {
    if (postBySlugMap.get(slug)?.result === result) postBySlugMap.delete(slug);
    return undefined;
  }
}

export async function getPodcastPosts(): Promise<WPPost[]> {
  const local = getLocalPodcasts();
  if (local && local.length > 0) return local;

  const [page1, page2, page3] = await Promise.all([
    getPosts({ perPage: 15, page: 1, withContent: true }),
    getPosts({ perPage: 15, page: 2, withContent: true }),
    getPosts({ perPage: 15, page: 3, withContent: true }),
  ]);
  const all = [...page1.data, ...page2.data, ...page3.data];
  return all.filter(p => !!p.youtubeId);
}

export async function getCategories(): Promise<Category[]> {
  const local = getLocalCategories();
  if (local && local.length > 0) return local;

  if (categoriesCache && categoriesCache.expires > Date.now()) return categoriesCache.result;
  const result = request<Category[]>("categories", { per_page: 100, hide_empty: "false" }, 3600).then(r => r.data);
  categoriesCache = { expires: Date.now() + (3600 * 1000), result };
  try { return await result; }
  catch (e) { categoriesCache = null; throw e; }
}

export async function getPages(): Promise<WPPage[]> {
  const local = getLocalPages();
  if (local && local.length > 0) return local;

  if (pagesCache && pagesCache.expires > Date.now()) return pagesCache.result;
  const result = request<WPPage[]>("pages", { per_page: 100 }, 3600).then(r => r.data);
  pagesCache = { expires: Date.now() + (3600 * 1000), result };
  try { return await result; }
  catch (e) { pagesCache = null; throw e; }
}

function getWidthTier(w: number): number {
  if (w <= 160) return 160;
  if (w <= 320) return 320;
  if (w <= 480) return 480;
  if (w <= 640) return 640;
  if (w <= 840) return 840;
  if (w <= 1080) return 1080;
  return 1200;
}

/**
 * Convert a remote image URL to an edge-cached proxy URL via /api/img.
 * Images are resized to width tiers and compressed to WebP.
 */
export function toCachedImageUrl(url?: string, w: number = 640, q: number = 75): string | undefined {
  if (!url) return undefined;
  // If already an API img proxy URL or local path, return as is
  if (url.startsWith("/api/img") || (url.startsWith("/") && !url.startsWith("/_next/image"))) {
    return url;
  }
  // If it was previous /_next/image format, extract original url
  if (url.startsWith("/_next/image")) {
    try {
      const parsed = new URL(url, "http://localhost:3000");
      const realUrl = parsed.searchParams.get("url");
      if (realUrl) url = realUrl;
    } catch {
      // keep url as is
    }
  }
  if (
    url.includes("orhunpolicycenter.com") ||
    url.includes("youtube.com") ||
    url.includes("ytimg.com")
  ) {
    const tier = getWidthTier(w);
    const quality = Math.max(50, Math.min(90, q));
    return `/api/img?url=${encodeURIComponent(url)}&w=${tier}&q=${quality}`;
  }
  return url;
}

export function postImage(post: WPPost, w?: number, q?: number): string | undefined {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  const sizes = media?.media_details?.sizes;
  const targetW = w || 640;

  let chosenUrl: string | undefined;

  // 1. Pick the best matching pre-generated WordPress size to save bandwidth and load super fast
  if (sizes) {
    if (targetW <= 200) {
      chosenUrl = sizes.thumbnail?.source_url || sizes.medium?.source_url;
    } else if (targetW <= 400) {
      chosenUrl = sizes.medium?.source_url || sizes["morenews-medium"]?.source_url || sizes.thumbnail?.source_url;
    } else if (targetW <= 640) {
      chosenUrl = sizes["morenews-medium"]?.source_url || sizes.medium_large?.source_url || sizes.medium?.source_url;
    } else if (targetW <= 900) {
      chosenUrl = sizes["morenews-large"]?.source_url || sizes.medium_large?.source_url || sizes.large?.source_url;
    } else {
      chosenUrl = sizes.large?.source_url || sizes["morenews-featured"]?.source_url || sizes.full?.source_url;
    }
  }

  // 2. If no media sizes matched, check media source_url
  if (!chosenUrl && media?.source_url) {
    chosenUrl = media.source_url;
  }

  // 3. Fall back to previewImage
  if (!chosenUrl && post.previewImage) {
    chosenUrl = post.previewImage;
  }

  // 4. Fall back to content image
  if (!chosenUrl) {
    const renderedContent = post.content?.rendered || post.excerpt?.rendered || "";
    if (renderedContent) {
      chosenUrl = contentImage(renderedContent);
    }
  }

  return toCachedImageUrl(chosenUrl, w, q);
}

export function postCategory(post: WPPost): string {
  const allCats = getLocalCategories();
  if (post.categories?.length) {
    const validCatId = post.categories.find(id => id === 3) || post.categories.find(id => id !== 1 && id !== 15) || post.categories[0];
    if (validCatId && validCatId !== 1) {
      const found = allCats.find(c => c.id === validCatId);
      if (found) return plainText(found.name);
    }
  }
  const categories = post._embedded?.["wp:term"]?.[0] || [];
  const category = categories.find(c => c.id === 3) || categories.find(c => c.id !== 1 && c.id !== 15) || categories[0];
  return category && category.id !== 1 ? plainText(category.name) : "يازما";
}

export function readingMinutes(post: WPPost): number {
  if (post.readMinutes) return post.readMinutes;
  const text = plainText(post.content?.rendered || post.excerpt?.rendered || "");
  if (!post.content?.rendered && post.excerpt?.rendered) {
    return Math.max(3, Math.min(8, Math.ceil(text.split(/\s+/).filter(Boolean).length / 15)));
  }
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 180));
}

export function displayDate(date: string): string {
  const [year, month, day] = date.slice(0, 10).split("-");
  return `${year}.${month}.${day}`;
}

function cleanSeriesTitle(title: string): string {
  return (title || "")
    .replace(/[（\(][ivxlcdmIVXLCDM0-9\s]+[）\)]/g, "")
    .replace(/\b\d+[-ـ]?قىسىم\b/g, "")
    .replace(/[-–—:«»"'\.,!\?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSeriesSlug(slug: string): string {
  return (slug || "").replace(/_[ivxlcdm]+$/i, "").replace(/_\d+$/, "").trim();
}

const STOP_WORDS = new Set([
  "بىلەن", "ئۈچۈن", "ھەققىدە", "بولغان", "قانداق", "نېمە", "ۋە", "بىر", "ياكى",
  "دەۋرى", "يىلى", "خەۋەر", "يېڭى", "دەستۇرى"
]);

export function getSmartRelatedPosts(currentPost: WPPost, limit = 8): WPPost[] {
  const allPosts = getLocalSnapshot().posts;
  if (!allPosts?.length) return [];

  const currentCleanTitle = cleanSeriesTitle(currentPost.title?.rendered || "").toLowerCase();
  const currentCleanSlug = cleanSeriesSlug(currentPost.slug || "").toLowerCase();
  const currentTags = new Set(currentPost.tags || []);
  const currentCats = new Set((currentPost.categories || []).filter(c => c !== 1));

  const titleWords = currentCleanTitle.split(/\s+/).filter(w => w.length >= 4 && !STOP_WORDS.has(w));

  const scored = allPosts
    .filter(p => p.id !== currentPost.id)
    .map(p => {
      let score = 0;
      const pCleanTitle = cleanSeriesTitle(p.title?.rendered || "").toLowerCase();
      const pCleanSlug = cleanSeriesSlug(p.slug || "").toLowerCase();

      // 1. Direct series / continuation match
      if (
        (currentCleanSlug.length > 5 && currentCleanSlug === pCleanSlug) ||
        (currentCleanTitle.length > 5 && currentCleanTitle === pCleanTitle)
      ) {
        score += 100;
      }

      // 2. Shared tags
      if (p.tags?.length && currentTags.size > 0) {
        for (const t of p.tags) {
          if (currentTags.has(t)) score += 30;
        }
      }

      // 3. Meaningful title keyword matches
      for (const w of titleWords) {
        if (pCleanTitle.includes(w)) score += 10;
      }

      // 4. Shared categories
      if (p.categories?.length && currentCats.size > 0) {
        for (const c of p.categories) {
          if (currentCats.has(c)) score += 5;
        }
      }

      return { post: p, score };
    });

  scored.sort((a, b) => {
    const isSeriesA = a.score >= 100;
    const isSeriesB = b.score >= 100;
    if (isSeriesA && isSeriesB) {
      return new Date(a.post.date).getTime() - new Date(b.post.date).getTime();
    }
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
  });

  return scored.slice(0, limit).map(s => s.post);
}
