import initialPodcasts from "@/data/podcasts.json";
import { getLocalPostBySlug } from "./cache-store";
import { toUyghurLatin } from "./i18n";
import type { WPPost } from "./wordpress";

export interface CuratedPodcast {
  id: string;
  youtubeId: string;
  title: string;
  titleLatin?: string;
  description: string;
  descriptionLatin?: string;
  date: string;
  postSlug?: string;
  category?: string;
  categoryLatin?: string;
  isFeatured?: boolean;
  order: number;
  durationMinutes?: number;
}

// In-memory store initialized from /tmp or bundled JSON
function loadInitialPodcasts(): CuratedPodcast[] {
  if (typeof window === "undefined") {
    try {
      const fs = require("fs");
      const path = require("path");
      const tmpPath = path.join("/tmp", "otuken_podcasts.json");
      if (fs.existsSync(tmpPath)) {
        const raw = fs.readFileSync(tmpPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 0) {
          return parsed;
        }
      }
    } catch {}
  }

  return (initialPodcasts as unknown as CuratedPodcast[]).map((p, idx) => ({
    ...p,
    order: typeof p.order === "number" ? p.order : idx + 1,
    isFeatured: Boolean(p.isFeatured),
  }));
}

let store: CuratedPodcast[] = loadInitialPodcasts();

export function extractYouTubeId(urlOrId: string): string {
  if (!urlOrId) return "";
  const cleaned = urlOrId.trim();

  // If it's already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned)) {
    return cleaned;
  }

  // Regex patterns for various YouTube URL forms
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/live\/([\w-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return cleaned;
}

export function getCuratedPodcasts(): CuratedPodcast[] {
  // Sync latest from /tmp if updated in serverless environment
  if (typeof window === "undefined") {
    try {
      const fs = require("fs");
      const path = require("path");
      const tmpPath = path.join("/tmp", "otuken_podcasts.json");
      if (fs.existsSync(tmpPath)) {
        const raw = fs.readFileSync(tmpPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          store = parsed;
        }
      }
    } catch {}
  }

  // Sort: featured first, then by order asc, then by date desc
  return [...store].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    if (a.order !== b.order) return a.order - b.order;
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeB - timeA;
  });
}

export function getCuratedPodcastById(id: string): CuratedPodcast | undefined {
  return store.find(p => p.id === id);
}

export function addOrUpdateCuratedPodcast(data: Partial<CuratedPodcast> & { youtubeId: string; title: string }): CuratedPodcast {
  const ytId = extractYouTubeId(data.youtubeId);
  const now = new Date().toISOString();

  if (data.id) {
    const index = store.findIndex(p => p.id === data.id);
    if (index !== -1) {
      // If setting as featured, remove featured from others
      if (data.isFeatured) {
        store.forEach(p => {
          p.isFeatured = false;
        });
      }

      store[index] = {
        ...store[index],
        ...data,
        youtubeId: ytId,
        date: data.date || store[index].date || now,
        order: data.order ?? store[index].order,
        isFeatured: Boolean(data.isFeatured),
      };
      persistStore();
      return store[index];
    }
  }

  // Creating a new podcast
  const newId = data.id || `pod-${Date.now().toString(36)}`;
  if (data.isFeatured) {
    store.forEach(p => {
      p.isFeatured = false;
    });
  }

  const nextOrder = store.length > 0 ? Math.max(...store.map(p => p.order || 0)) + 1 : 1;

  const newPodcast: CuratedPodcast = {
    id: newId,
    youtubeId: ytId,
    title: data.title,
    titleLatin: data.titleLatin || toUyghurLatin(data.title),
    description: data.description || "",
    descriptionLatin: data.descriptionLatin || (data.description ? toUyghurLatin(data.description) : ""),
    date: data.date || now,
    postSlug: data.postSlug ? data.postSlug.trim() : undefined,
    category: data.category || "سىياسەت ۋە دۇنيا",
    categoryLatin: data.categoryLatin || (data.category ? toUyghurLatin(data.category) : "Siyaset we Dunya"),
    isFeatured: Boolean(data.isFeatured),
    order: data.order ?? nextOrder,
    durationMinutes: data.durationMinutes || 25,
  };

  store.push(newPodcast);
  persistStore();
  return newPodcast;
}

export function setFeaturedPodcast(id: string): boolean {
  let found = false;
  store.forEach(p => {
    if (p.id === id) {
      p.isFeatured = true;
      found = true;
    } else {
      p.isFeatured = false;
    }
  });
  if (found) persistStore();
  return found;
}

export function reorderCuratedPodcasts(idsInOrder: string[]): CuratedPodcast[] {
  idsInOrder.forEach((id, idx) => {
    const item = store.find(p => p.id === id);
    if (item) {
      item.order = idx + 1;
    }
  });
  persistStore();
  return getCuratedPodcasts();
}

export function deleteCuratedPodcast(id: string): boolean {
  const initialLength = store.length;
  const targetId = String(id).trim();
  store = store.filter(p => String(p.id).trim() !== targetId && p.youtubeId !== targetId);
  if (store.length !== initialLength) {
    persistStore();
    return true;
  }
  return false;
}

/**
 * Persist store to disk (in local repo or in serverless /tmp)
 */
function persistStore(): boolean {
  if (typeof window !== "undefined") return false;
  let saved = false;

  // 1. Write to local repo src/data/podcasts.json (works in local dev)
  try {
    const fs = require("fs");
    const path = require("path");
    const repoPath = path.join(process.cwd(), "src/data/podcasts.json");
    fs.writeFileSync(repoPath, JSON.stringify(store, null, 2), "utf-8");
    saved = true;
  } catch {}

  // 2. Also write to /tmp/otuken_podcasts.json (writable in Vercel serverless functions)
  try {
    const fs = require("fs");
    const path = require("path");
    const tmpPath = path.join("/tmp", "otuken_podcasts.json");
    fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), "utf-8");
    saved = true;
  } catch {}

  return saved;
}

/**
 * Convert curated podcasts into WPPost format so existing PodcastView & shell can display them
 */
export function getPodcastPostsAsWP(locale: "uy" | "ug" = "uy"): WPPost[] {
  const podcasts = getCuratedPodcasts();

  return podcasts.map((pod, idx) => {
    // Check if matched to a real article in the system
    const linkedPost = pod.postSlug ? getLocalPostBySlug(pod.postSlug) : undefined;

    const baseTitle = pod.title;
    const baseDesc = pod.description;
    const baseCategory = pod.category || "سىن ۋە پودكاست";

    const title = locale === "ug"
      ? (pod.titleLatin || toUyghurLatin(baseTitle))
      : baseTitle;

    const excerpt = locale === "ug"
      ? (pod.descriptionLatin || toUyghurLatin(baseDesc))
      : baseDesc;

    const category = locale === "ug"
      ? (pod.categoryLatin || toUyghurLatin(baseCategory))
      : baseCategory;

    const ytThumb = pod.youtubeId
      ? `https://img.youtube.com/vi/${pod.youtubeId}/hqdefault.jpg`
      : undefined;

    const numericId = linkedPost?.id || (100000 + idx);
    const link = linkedPost?.link
      ? (locale === "ug" ? linkedPost.link.replace(/\/uy(\/|$)/, "/ug$1") : linkedPost.link)
      : (linkedPost ? (locale === "ug" ? `/ug/post/${linkedPost.slug}` : `/uy/post/${linkedPost.slug}`) : (locale === "ug" ? `/ug/podcasts` : `/uy/podcasts`));

    return {
      id: numericId,
      date: pod.date,
      modified: linkedPost?.modified || pod.date,
      slug: linkedPost?.slug || pod.postSlug || pod.id,
      link,
      title: { rendered: title },
      excerpt: { rendered: excerpt },
      content: { rendered: linkedPost?.content?.rendered || excerpt },
      categories: linkedPost?.categories || [999],
      previewImage: linkedPost?.previewImage || ytThumb,
      youtubeId: pod.youtubeId,
      readMinutes: pod.durationMinutes || 25,
      _embedded: linkedPost?._embedded,
    };
  });
}
