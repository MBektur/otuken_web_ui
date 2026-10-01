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

// In-memory mutable store initialized from the bundled snapshot
let currentCache: CacheSnapshot = {
  syncedAt: initialData.syncedAt || new Date().toISOString(),
  latestModified: initialData.latestModified || new Date().toISOString(),
  totalPosts: initialData.totalPosts || (initialData.posts?.length ?? 0),
  categories: (initialData.categories || []) as unknown as Category[],
  pages: (initialData.pages || []) as unknown as WPPage[],
  posts: (initialData.posts || []) as unknown as WPPost[],
};

export function getLocalSnapshot(): CacheSnapshot {
  return currentCache;
}

export function updateLocalSnapshot(updated: Partial<CacheSnapshot>) {
  currentCache = {
    ...currentCache,
    ...updated,
    syncedAt: new Date().toISOString(),
  };
}

export function getLocalCategories(): Category[] {
  return currentCache.categories;
}

export function getLocalPages(): WPPage[] {
  return currentCache.pages;
}

function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
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
    const q = options.search.toLowerCase().trim();
    list = list.filter(p => {
      const title = p.title?.rendered ? p.title.rendered.toLowerCase() : "";
      const excerpt = p.excerpt?.rendered ? p.excerpt.rendered.toLowerCase() : "";
      return title.includes(q) || excerpt.includes(q);
    });
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
