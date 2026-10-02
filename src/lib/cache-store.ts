import initialData from "@/data/cache.json";
import type { Category, WPPage, WPPost } from "./wordpress";

export type CacheSnapshot = {
  syncedAt: string;
  latestModified: string;
  totalPosts: number;
  categories: Category[];
  pages: WPPage[];
  posts: WPPost[];
};

export function sortPostsByDateDesc(posts: WPPost[]): WPPost[] {
  return [...posts].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeB - timeA;
  });
}

// In-memory mutable store initialized from the bundled snapshot
let currentCache: CacheSnapshot = {
  syncedAt: initialData.syncedAt || new Date().toISOString(),
  latestModified: initialData.latestModified || new Date().toISOString(),
  totalPosts: initialData.totalPosts || (initialData.posts?.length ?? 0),
  categories: (initialData.categories || []) as unknown as Category[],
  pages: (initialData.pages || []) as unknown as WPPage[],
  posts: sortPostsByDateDesc((initialData.posts || []) as unknown as WPPost[]),
};

export function getLocalSnapshot(): CacheSnapshot {
  return currentCache;
}

export function updateLocalSnapshot(updated: Partial<CacheSnapshot>) {
  const mergedPosts = updated.posts ? sortPostsByDateDesc(updated.posts) : currentCache.posts;
  currentCache = {
    ...currentCache,
    ...updated,
    posts: mergedPosts,
    totalPosts: updated.totalPosts ?? mergedPosts.length,
    syncedAt: new Date().toISOString(),
  };
}

export function getLocalCategories(): Category[] {
  return currentCache.categories;
}

export function getLocalPages(): WPPage[] {
  return currentCache.pages;
}

import { robustDecode, plainText } from "./content";
import { getScriptVariants, toUyghurCyrillic, toUyghurLatin } from "./i18n";

export const safeDecode = robustDecode;

interface PostSearchIndex {
  titleArab: string;
  excerptArab: string;
  titleCyr: string;
  excerptCyr: string;
  titleLat: string;
  excerptLat: string;
}

const postSearchMap = new WeakMap<WPPost, PostSearchIndex>();

function getPostSearchIndex(p: WPPost): PostSearchIndex {
  let idx = postSearchMap.get(p);
  if (!idx) {
    const cleanTitle = p.title?.rendered ? plainText(p.title.rendered).toLowerCase() : "";
    const cleanExcerpt = p.excerpt?.rendered ? plainText(p.excerpt.rendered).toLowerCase() : "";
    let titleCyr = "";
    let excerptCyr = "";
    let titleLat = "";
    let excerptLat = "";
    try { titleCyr = toUyghurCyrillic(cleanTitle).toLowerCase(); } catch {}
    try { excerptCyr = toUyghurCyrillic(cleanExcerpt).toLowerCase(); } catch {}
    try { titleLat = toUyghurLatin(cleanTitle).toLowerCase(); } catch {}
    try { excerptLat = toUyghurLatin(cleanExcerpt).toLowerCase(); } catch {}

    idx = {
      titleArab: cleanTitle,
      excerptArab: cleanExcerpt,
      titleCyr,
      excerptCyr,
      titleLat,
      excerptLat,
    };
    postSearchMap.set(p, idx);
  }
  return idx;
}

export function getLocalPostBySlug(slug: string): WPPost | undefined {
  if (!slug) return undefined;
  const target = safeDecode(slug).toLowerCase().trim();
  const rawTarget = slug.toLowerCase().trim();
  return currentCache.posts.find(p => {
    if (!p.slug) return false;
    const s = safeDecode(p.slug).toLowerCase().trim();
    return s === target || p.slug.toLowerCase().trim() === rawTarget;
  });
}

export function getLocalPosts(options: {
  page?: number;
  perPage?: number;
  category?: number;
  search?: string;
  exclude?: number[];
} = {}): { data: WPPost[]; total: number; totalPages: number } {
  let list = currentCache.posts;

  if (options.category) {
    list = list.filter(p => p.categories && p.categories.includes(options.category!));
  }

  if (options.search) {
    const rawSearch = safeDecode(options.search).trim();
    if (rawSearch) {
      const tokens = rawSearch.split(/\s+/).filter(Boolean);
      const tokenVariants = tokens.map(getScriptVariants);
      const phraseVariants = getScriptVariants(rawSearch);

      list = list.filter(p => {
        const idx = getPostSearchIndex(p);

        // 1. Check full phrase match across any script
        for (const pv of phraseVariants) {
          if (
            idx.titleArab.includes(pv) ||
            idx.excerptArab.includes(pv) ||
            idx.titleCyr.includes(pv) ||
            idx.excerptCyr.includes(pv) ||
            idx.titleLat.includes(pv) ||
            idx.excerptLat.includes(pv)
          ) {
            return true;
          }
        }

        // 2. Multi-token: check all words match across any script
        if (tokens.length > 1) {
          const allTokensMatch = tokenVariants.every(variants => {
            return variants.some(v =>
              idx.titleArab.includes(v) ||
              idx.excerptArab.includes(v) ||
              idx.titleCyr.includes(v) ||
              idx.excerptCyr.includes(v) ||
              idx.titleLat.includes(v) ||
              idx.excerptLat.includes(v)
            );
          });
          if (allTokensMatch) return true;
        }

        return false;
      });
    }
  }

  if (options.exclude?.length) {
    const excludeSet = new Set(options.exclude);
    list = list.filter(p => !excludeSet.has(p.id));
  }

  const total = list.length;
  const perPage = options.perPage || 12;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.max(1, Math.min(totalPages, options.page || 1));
  const start = (page - 1) * perPage;
  const data = list.slice(start, start + perPage);

  return { data, total, totalPages };
}

export function getLocalPodcasts(): WPPost[] {
  return currentCache.posts.filter(p => !!p.youtubeId);
}
