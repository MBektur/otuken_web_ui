import fs from "node:fs/promises";
import path from "node:path";

const WORDPRESS_URL = "https://orhunpolicycenter.com/uy";

function extractYoutubeId(content: string): string | undefined {
  const match = content.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/
  );
  return match ? match[1] : undefined;
}

function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function readingMinutes(content: string, excerpt: string): number {
  const text = plainText(content || excerpt || "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

function postImage(post: any): string | undefined {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  const renderedContent = post.content?.rendered || post.excerpt?.rendered || "";
  const match = renderedContent.match(/<img[^>]+src=["']([^"']+)["']/i);
  return (
    media?.media_details?.sizes?.large?.source_url ||
    media?.source_url ||
    (match ? match[1] : undefined)
  );
}

async function sync() {
  console.log("🔄 Starting full cache sync from WordPress...");

  try {
    const [categoriesRes, pagesRes, postsRes] = await Promise.all([
      fetch(`${WORDPRESS_URL}/wp-json/wp/v2/categories?per_page=100&hide_empty=false`, {
        signal: AbortSignal.timeout(20000),
      }),
      fetch(`${WORDPRESS_URL}/wp-json/wp/v2/pages?per_page=100`, {
        signal: AbortSignal.timeout(20000),
      }),
      fetch(`${WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=100&_embed=1`, {
        signal: AbortSignal.timeout(30000),
      }),
    ]);

    if (!categoriesRes.ok || !pagesRes.ok || !postsRes.ok) {
      throw new Error(`WordPress API error: cats=${categoriesRes.status}, pages=${pagesRes.status}, posts=${postsRes.status}`);
    }

    const categories = await categoriesRes.json();
    const pages = await pagesRes.json();
    const rawPosts = await postsRes.json();

    const posts = rawPosts.map((post: any) => {
      const ytId = post.content?.rendered ? extractYoutubeId(post.content.rendered) : undefined;
      return {
        ...post,
        previewImage: postImage(post) || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined),
        readMinutes: readingMinutes(post.content?.rendered || "", post.excerpt?.rendered || ""),
        youtubeId: ytId,
      };
    });

    const cacheData = {
      syncedAt: new Date().toISOString(),
      latestModified: posts[0]?.modified || new Date().toISOString(),
      totalPosts: posts.length,
      categories,
      pages,
      posts,
    };

    const targetDir = path.resolve(process.cwd(), "src/data");
    await fs.mkdir(targetDir, { recursive: true });

    const targetFile = path.join(targetDir, "cache.json");
    await fs.writeFile(targetFile, JSON.stringify(cacheData, null, 2), "utf8");

    console.log(`✅ Cache sync complete!`);
    console.log(`   - Total Posts: ${posts.length}`);
    console.log(`   - Total Categories: ${categories.length}`);
    console.log(`   - Total Pages: ${pages.length}`);
    console.log(`   - Saved to: ${targetFile}`);
  } catch (error) {
    console.error("❌ Cache sync failed:", error);
    process.exit(1);
  }
}

sync();
