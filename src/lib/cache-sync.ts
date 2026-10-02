import { revalidatePath, revalidateTag } from "next/cache";
import { WORDPRESS_URL, localPath, plainText } from "./content";
import { clearMemoryCache } from "./wordpress";
import { getLocalSnapshot, updateLocalSnapshot } from "./cache-store";

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
  try {
    revalidateTag("posts", "max");
    revalidateTag("categories", "max");
    revalidateTag("pages", "max");
  } catch {}

  revalidatePath("/uy", "layout");
  revalidatePath("/uy");
  revalidatePath("/ug", "layout");
  revalidatePath("/ug");
  revalidatePath("/uy/podcasts");
  revalidatePath("/ug/podcasts");

  return {
    ok: true,
    action: "all",
    message: "بارلىق بەتلەر ۋە مەزمۇنلار مۇۋەپپەقىيەتلىك يېڭىلاندى",
    timestamp: new Date().toISOString(),
  };
}

export async function revalidateSpecificUrl(inputUrlOrSlug: string) {
  clearMemoryCache();
  try {
    revalidateTag("posts", "max");
  } catch {}

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
  revalidatePath("/ug");
  revalidatePath("/uy/podcasts");
  revalidatePath("/ug/podcasts");

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
  try {
    revalidateTag("posts", "max");
  } catch {}

  const status = await fetchLatestWordPressStatus();

  // Revalidate most recently modified posts for both Uy and Ug
  const revalidatedPaths: string[] = [];
  for (const post of status.recentPosts) {
    if (post.link) {
      revalidatePath(post.link);
      revalidatedPaths.push(post.link);
      const ugLink = localPath(post.link, "/ug");
      revalidatePath(ugLink);
      revalidatedPaths.push(ugLink);
    }
  }

  // Fetch newest posts (up to 20) to update in-memory snapshot
  try {
    const freshRes = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=20&_embed=1`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (freshRes.ok) {
      const freshPosts: any[] = await freshRes.json();
      const current = getLocalSnapshot();
      const mergedPosts = [...current.posts];
      for (const fp of freshPosts) {
        const idx = mergedPosts.findIndex(p => p.id === fp.id);
        if (idx >= 0) {
          mergedPosts[idx] = { ...mergedPosts[idx], ...fp };
        } else {
          mergedPosts.unshift(fp);
        }
      }
      updateLocalSnapshot({
        posts: mergedPosts,
        latestModified: status.latestModified,
        totalPosts: mergedPosts.length,
      });
    }
  } catch {
    // Non-blocking fallback
  }

  // Revalidate home and podcast pages to reflect any new additions or edits
  revalidatePath("/uy");
  revalidatePath("/uy/podcasts");
  revalidatePath("/ug");
  revalidatePath("/ug/podcasts");

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

export async function preWarmSite(limit = 100, baseUrl?: string) {
  clearMemoryCache();
  try {
    revalidateTag("posts", "max");
  } catch {}

  // 1. Fetch all posts from WordPress across pages if needed
  let allPosts: any[] = [];
  let totalPosts = 0;

  try {
    const firstRes = await fetch(
      `${WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=100&page=1&orderby=modified&order=desc&_fields=id,date,modified,slug,link,title`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!firstRes.ok) {
      throw new Error(`WordPress API returned status ${firstRes.status}`);
    }

    allPosts = await firstRes.json();
    const totalPages = Number(firstRes.headers.get("X-WP-TotalPages") || 1);
    totalPosts = Number(firstRes.headers.get("X-WP-Total") || allPosts.length);

    if (totalPages > 1) {
      for (let p = 2; p <= totalPages; p++) {
        try {
          const nextRes = await fetch(
            `${WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=100&page=${p}&orderby=modified&order=desc&_fields=id,date,modified,slug,link,title`,
            {
              cache: "no-store",
              signal: AbortSignal.timeout(15000),
            }
          );
          if (nextRes.ok) {
            const morePosts = await nextRes.json();
            allPosts.push(...morePosts);
          }
        } catch {
          // Non-blocking for additional pages
        }
      }
    }
  } catch (err: any) {
    throw new Error(`WordPress API returned error: ${err.message}`);
  }

  // 2. Synchronize in-memory snapshot with latest slugs, links and titles
  try {
    const current = getLocalSnapshot();
    const mergedPosts = [...current.posts];
    for (const post of allPosts) {
      const idx = mergedPosts.findIndex(p => p.id === post.id);
      if (idx >= 0) {
        mergedPosts[idx] = {
          ...mergedPosts[idx],
          slug: post.slug,
          link: post.link,
          title: post.title,
          modified: post.modified,
        };
      } else {
        mergedPosts.unshift(post);
      }
    }
    updateLocalSnapshot({
      posts: mergedPosts,
      latestModified: allPosts[0]?.modified || current.latestModified,
      totalPosts: mergedPosts.length,
    });
  } catch {
    // Non-blocking
  }

  // Target paths for pre-caching (both Uy and Ug locales)
  const paths: string[] = ["/uy", "/uy/podcasts", "/ug", "/ug/podcasts"];
  for (const p of allPosts) {
    if (p.link) {
      const lpUy = localPath(p.link, "/uy");
      if (!paths.includes(lpUy)) paths.push(lpUy);
      const lpUg = localPath(p.link, "/ug");
      if (!paths.includes(lpUg)) paths.push(lpUg);
    }
  }

  // Revalidate Next.js cache for all paths
  for (const p of paths) {
    revalidatePath(p);
  }

  // Determine base origin for warm-up requests
  const origin = (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://otuken-policy-center.vercel.app").replace(/\/$/, "");

  let warmedCount = 0;
  const warmedPaths: string[] = [];

  // Batch warm-up requests (6 concurrent at a time)
  const batchSize = 6;
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
    message: `جەمئىي ${totalPosts} يازما بايقالدى. ${warmedCount} بەت مۇۋەپپەقىيەتلىك ئىسسىتىلىپ، تېز خاتىرە ئەسلىمىگە تولۇق ساقلاندى (${totalPosts} yazıdan ${warmedCount} sayfa önbelleklendi)`,
    samplePaths: warmedPaths.slice(0, 10),
    timestamp: new Date().toISOString(),
  };
}
