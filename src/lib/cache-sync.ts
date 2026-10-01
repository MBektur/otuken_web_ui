import { revalidatePath } from "next/cache";
import { WORDPRESS_URL, localPath, plainText } from "./content";
import { clearMemoryCache } from "./wordpress";

export const DEFAULT_SECRET = process.env.REVALIDATE_SECRET || "otuken2026";

export interface SyncStatus {
  ok: boolean;
  totalPosts: number;
  latestModified: string;
  latestTitle: string;
  recentPosts: Array<{
    id: number;
    title: string;
    modified: string;
    link: string;
  }>;
}

export function isValidSecret(secret?: string | null): boolean {
  if (!secret) return false;
  return secret === DEFAULT_SECRET;
}

export async function fetchLatestWordPressStatus(): Promise<SyncStatus> {
  const url = `${WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=5&orderby=modified&order=desc&_fields=id,date,modified,slug,link,title`;
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`WordPress API returned status ${res.status}`);
  }

  const totalPosts = Number(res.headers.get("X-WP-Total") || 0);
  const posts: any[] = await res.json();

  return {
    ok: true,
    totalPosts,
    latestModified: posts[0]?.modified || "",
    latestTitle: posts[0]?.title?.rendered ? plainText(posts[0].title.rendered) : "",
    recentPosts: posts.map(p => ({
      id: p.id,
      title: plainText(p.title?.rendered || ""),
      modified: p.modified,
      link: localPath(p.link || ""),
    })),
  };
}

export async function revalidateAllPages() {
  clearMemoryCache();
  revalidatePath("/uy", "layout");
  revalidatePath("/uy");
  revalidatePath("/uy/podcasts");

  return {
    ok: true,
    action: "all",
    message: "بارلىق بەتلەر ۋە مەزمۇنلار مۇۋەپپەقىيەتلىك يېڭىلاندى",
    timestamp: new Date().toISOString(),
  };
}

export async function revalidateSpecificUrl(inputUrlOrSlug: string) {
  clearMemoryCache();
  let path = inputUrlOrSlug.trim();

  // If full URL was provided
  if (path.startsWith("http")) {
    path = localPath(path);
  }

  if (!path.startsWith("/")) {
    path = `/uy/${path}`;
  }

  revalidatePath(path);
  revalidatePath("/uy");
  revalidatePath("/uy/podcasts");

  return {
    ok: true,
    action: "single",
    path,
    message: `«${path}» بېتىنىڭ تېز خاتىرە ئەسلىمىسى يېڭىلاندى`,
    timestamp: new Date().toISOString(),
  };
}

export async function autoSyncModifiedPosts() {
  clearMemoryCache();
  const status = await fetchLatestWordPressStatus();

  // Revalidate top 5 most recently modified posts
  const revalidatedPaths: string[] = [];
  for (const post of status.recentPosts) {
    if (post.link) {
      revalidatePath(post.link);
      revalidatedPaths.push(post.link);
    }
  }

  // Revalidate home and podcast pages to reflect any new additions or edits
  revalidatePath("/uy");
  revalidatePath("/uy/podcasts");

  return {
    ok: true,
    action: "sync",
    syncedCount: revalidatedPaths.length,
    latestModified: status.latestModified,
    latestTitle: status.latestTitle,
    revalidatedPaths,
    timestamp: new Date().toISOString(),
  };
}

export async function preWarmSite(limit = 50, baseUrl?: string) {
  clearMemoryCache();
  const fetchLimit = Math.min(Math.max(limit, 10), 100);
  const url = `${WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=${fetchLimit}&orderby=modified&order=desc&_fields=id,date,modified,slug,link,title`;

  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`WordPress API returned status ${res.status}`);
  }

  const posts: any[] = await res.json();
  const totalPosts = Number(res.headers.get("X-WP-Total") || posts.length);

  // Target paths for pre-caching
  const paths: string[] = ["/uy", "/uy/podcasts"];
  for (const p of posts) {
    if (p.link) {
      const lp = localPath(p.link);
      if (!paths.includes(lp)) paths.push(lp);
    }
  }

  // 1. Revalidate Next.js cache for all paths
  for (const p of paths) {
    revalidatePath(p);
  }

  // 2. Determine base origin for warm-up requests
  const origin = (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://otuken-policy-center.vercel.app").replace(/\/$/, "");

  let warmedCount = 0;
  const warmedPaths: string[] = [];

  // Batch warm-up requests (5 concurrent at a time)
  const batchSize = 5;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async p => {
        try {
          const warmUrl = `${origin}${p}`;
          const r = await fetch(warmUrl, {
            headers: { "x-warmup": "1", "User-Agent": "OtukenWarmer/1.0" },
            signal: AbortSignal.timeout(10000),
          });
          if (r.ok) {
            warmedCount++;
            warmedPaths.push(p);
          }
        } catch {
          // Ignore individual timeouts
        }
      })
    );
  }

  return {
    ok: true,
    action: "warmup",
    totalPosts,
    warmedCount,
    totalTargeted: paths.length,
    message: `${warmedCount} بەت مۇۋەپپەقىيەتلىك ئىسسىتىلىپ، تېز خاتىرە ئەسلىمىگە تولۇق ساقلاندى (${warmedCount} sayfa başarıyla ısıtılıp önbelleklendi)`,
    samplePaths: warmedPaths.slice(0, 10),
    timestamp: new Date().toISOString(),
  };
}
